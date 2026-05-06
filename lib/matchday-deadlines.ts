import { eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches } from "@/lib/db/schema";

/**
 * El cierre de predicciones de una jornada SIEMPRE es la hora del primer
 * partido de esa jornada. Lo cacheamos en `matchdays.prediction_deadline_at`
 * para que el resto del código (banner de cierre, badge de pendientes,
 * sort por deadline, etc.) siga funcionando sin tener que cruzar matches
 * en cada query.
 *
 * Llama a este helper cada vez que se cree/edite/borre un partido. Si la
 * jornada se queda sin partidos, dejamos el valor anterior intacto — no
 * tenemos forma de derivar uno y cualquier reemplazo (por ejemplo `Infinity`)
 * rompe el ordering.
 */
export async function recomputeMatchdayDeadlines(
  matchdayIds: ReadonlyArray<number | null | undefined>,
): Promise<void> {
  const ids = Array.from(
    new Set(
      matchdayIds.filter(
        (x): x is number => typeof x === "number" && Number.isFinite(x),
      ),
    ),
  );
  if (ids.length === 0) return;

  const rows = await db
    .select({
      matchdayId: matches.matchdayId,
      first: sql<Date>`min(${matches.scheduledAt})`,
    })
    .from(matches)
    .where(inArray(matches.matchdayId, ids))
    .groupBy(matches.matchdayId);

  await Promise.all(
    rows.map((r) =>
      r.matchdayId == null || r.first == null
        ? Promise.resolve()
        : db
            .update(matchdays)
            .set({ predictionDeadlineAt: new Date(r.first) })
            .where(eq(matchdays.id, r.matchdayId)),
    ),
  );
}

/** Recompute todas las jornadas (para backfills / scripts de seed). */
export async function recomputeAllMatchdayDeadlines(): Promise<void> {
  const rows = await db
    .select({
      matchdayId: matches.matchdayId,
      first: sql<Date>`min(${matches.scheduledAt})`,
    })
    .from(matches)
    .where(sql`${matches.matchdayId} is not null`)
    .groupBy(matches.matchdayId);

  await Promise.all(
    rows.map((r) =>
      r.matchdayId == null || r.first == null
        ? Promise.resolve()
        : db
            .update(matchdays)
            .set({ predictionDeadlineAt: new Date(r.first) })
            .where(eq(matchdays.id, r.matchdayId)),
    ),
  );
}
