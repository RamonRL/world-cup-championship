"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  matchdays,
  matches,
  players,
  predMatchResult,
  predMatchScorer,
} from "@/lib/db/schema";
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
        scorerPlayerId: z.coerce.number().int().optional().nullable(),
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

  // Validate that all matches belong to this matchday and load their squads
  // so we can check that any picked scorer plays for one of the two teams.
  const matchRows = await db
    .select({
      id: matches.id,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
    })
    .from(matches)
    .where(eq(matches.matchdayId, parsed.data.matchdayId));
  const matchById = new Map(matchRows.map((m) => [m.id, m]));
  for (const p of parsed.data.predictions) {
    if (!matchById.has(p.matchId)) {
      return { ok: false, error: "Partido no pertenece a esta jornada." };
    }
  }

  const scorerIds = parsed.data.predictions
    .map((p) => p.scorerPlayerId)
    .filter((id): id is number => typeof id === "number");
  const scorerRows =
    scorerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, scorerIds))
      : [];
  const scorerById = new Map(scorerRows.map((p) => [p.id, p]));
  for (const p of parsed.data.predictions) {
    if (p.scorerPlayerId == null) continue;
    const player = scorerById.get(p.scorerPlayerId);
    if (!player) {
      return { ok: false, error: "Jugador no encontrado." };
    }
    const m = matchById.get(p.matchId)!;
    if (player.teamId !== m.homeTeamId && player.teamId !== m.awayTeamId) {
      return { ok: false, error: "Ese jugador no juega este partido." };
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

      if (p.scorerPlayerId == null) {
        await tx
          .delete(predMatchScorer)
          .where(
            and(
              eq(predMatchScorer.userId, me.id),
              eq(predMatchScorer.matchId, p.matchId),
            ),
          );
      } else {
        await tx
          .insert(predMatchScorer)
          .values({
            userId: me.id,
            matchId: p.matchId,
            playerId: p.scorerPlayerId,
            submittedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: [predMatchScorer.userId, predMatchScorer.matchId],
            set: {
              playerId: p.scorerPlayerId,
              submittedAt: new Date(),
            },
          });
      }
    }
  });

  revalidatePath(`/predicciones/jornada/${parsed.data.matchdayId}`);
  revalidatePath("/predicciones");
  revalidatePath("/dashboard");
  return { ok: true };
}
