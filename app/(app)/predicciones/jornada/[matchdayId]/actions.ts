"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchdays, matches, predMatchResult } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { getMatchdayState, type Stage } from "@/lib/matchday-state";

export type FormState = { ok: boolean; error?: string };

const schema = z.object({
  matchdayId: z.coerce.number().int(),
  predictions: z
    .array(
      z.object({
        matchId: z.coerce.number().int(),
        homeScore: z.coerce.number().int().min(0).max(40),
        awayScore: z.coerce.number().int().min(0).max(40),
        willGoToPens: z.coerce.boolean().default(false),
        winnerTeamId: z.coerce.number().int().optional().nullable(),
      }),
    )
    .min(1),
});

export async function saveMatchdayPredictions(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireUser();
  let payload: unknown;
  try {
    payload = JSON.parse(String(formData.get("payload") ?? ""));
  } catch {
    return { ok: false, error: "Datos malformados." };
  }
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // Enforce matchday state: must be open (predecessor stage finished + deadline future).
  const [day] = await db
    .select()
    .from(matchdays)
    .where(eq(matchdays.id, parsed.data.matchdayId))
    .limit(1);
  if (!day) return { ok: false, error: "Jornada no encontrada." };
  const status = await getMatchdayState({
    stage: day.stage as Stage,
    predictionDeadlineAt: day.predictionDeadlineAt,
  });
  if (status.state === "waiting") {
    return {
      ok: false,
      error: status.reason ?? "Esta jornada todavía no se ha desbloqueado.",
    };
  }
  if (status.state === "closed") {
    return { ok: false, error: "La predicción para esta jornada ya está cerrada." };
  }

  // Validate that all matches belong to this matchday.
  const matchIdsInDay = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.matchdayId, parsed.data.matchdayId));
  const validIds = new Set(matchIdsInDay.map((m) => m.id));
  for (const p of parsed.data.predictions) {
    if (!validIds.has(p.matchId)) {
      return { ok: false, error: "Partido no pertenece a esta jornada." };
    }
  }

  await db.transaction(async (tx) => {
    for (const p of parsed.data.predictions) {
      await tx
        .insert(predMatchResult)
        .values({
          userId: me.id,
          matchId: p.matchId,
          homeScore: p.homeScore,
          awayScore: p.awayScore,
          willGoToPens: p.willGoToPens,
          winnerTeamId: p.winnerTeamId ?? null,
          submittedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: [predMatchResult.userId, predMatchResult.matchId],
          set: {
            homeScore: p.homeScore,
            awayScore: p.awayScore,
            willGoToPens: p.willGoToPens,
            winnerTeamId: p.winnerTeamId ?? null,
            submittedAt: new Date(),
          },
        });
    }
  });

  revalidatePath(`/predicciones/jornada/${parsed.data.matchdayId}`);
  revalidatePath("/predicciones");
  revalidatePath("/dashboard");
  return { ok: true };
}
