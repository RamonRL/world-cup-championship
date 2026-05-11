import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagueMemberships } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  countAnyPicksInLeague,
  findLeaguesWithPicks,
  type LeagueWithPicks,
} from "@/lib/import-predictions";
import { ImportBannerClient } from "./import-banner-client";

/**
 * Server component que decide si renderizar el banner. Se muestra cuando:
 *   - el usuario NO tiene picks en la liga activa (target vacío), Y
 *   - tiene picks en al menos otra liga suya (origen disponible).
 * En cualquier otro caso devuelve null.
 *
 * Short-circuit barato: si el usuario solo está en una liga (la activa),
 * no hay origen posible — saltamos las 12+ queries de countAnyPicksInLeague
 * + findLeaguesWithPicks. Crítico para usuarios recién creados en la pública.
 */
export async function ImportPredictionsBanner({
  userId,
  activeLeagueId,
}: {
  userId: string;
  activeLeagueId: number;
}) {
  const [{ c: membershipCount }] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(leagueMemberships)
    .where(eq(leagueMemberships.userId, userId));
  if (membershipCount <= 1) return null;

  const [activePicks, otherLeagues] = await Promise.all([
    countAnyPicksInLeague(userId, activeLeagueId),
    findLeaguesWithPicks(userId, activeLeagueId),
  ]);

  if (activePicks > 0) return null;
  if (otherLeagues.length === 0) return null;

  return <ImportBannerClient sources={otherLeagues} />;
}

export type { LeagueWithPicks };
