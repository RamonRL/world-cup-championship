"use server";

import { revalidatePath } from "next/cache";
import { and, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import {
  groupStandings,
  matchScorers,
  matches,
  pointsLedger,
  predTournamentTopScorer,
  specialPredictions,
  teams,
} from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/admin/audit";
import { recomputeAllGroupStandings } from "@/lib/scoring/group-standings";
import {
  recomputeAllScoring,
  recomputeBracketStageForAllUsers,
  recomputeGroupScoringForAllUsers,
  recomputeMatchScoringForAllUsers,
  recomputeSpecialPredictionForAllUsers,
  recomputeTopScorerForAllUsers,
} from "@/lib/scoring/persistence";

export type FormState = { ok: boolean; error?: string; message?: string };

/**
 * Close the group stage: compute final group_standings from finished group
 * matches, then trigger group ranking scoring for every group.
 */
export async function closeGroupStage(): Promise<FormState> {
  const me = await requireAdmin();
  const finishedRows = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.stage, "group"), eq(matches.status, "finished")));
  if (finishedRows.length === 0) {
    return { ok: false, error: "No hay partidos de fase de grupos finalizados." };
  }

  // La construcción de la clasificación vive en lib/scoring/group-standings
  // y la usa también `saveMatchResult` para refrescar tablas en vivo. Aquí
  // basta con asegurarnos de que está al día y luego repartir los puntos
  // de la categoría "Posiciones de grupo".
  const { groupCount } = await recomputeAllGroupStandings();

  const groupRows = await db
    .selectDistinct({ groupId: groupStandings.groupId })
    .from(groupStandings);
  for (const { groupId } of groupRows) {
    await recomputeGroupScoringForAllUsers(groupId);
  }

  await logAdminAction({
    adminId: me.id,
    action: "ops.close_group_stage",
    payload: { groupCount },
  });

  revalidatePath("/grupos");
  revalidatePath("/grupos/[code]", "page");
  revalidatePath("/bracket");
  revalidatePath("/ranking");
  return { ok: true, message: `Fase de grupos cerrada. ${groupCount} grupos calculados.` };
}

const closeKnockoutSchema = z.object({
  stageKey: z.enum(["r16", "qf", "sf", "final", "champion"]),
});

/**
 * Close a knockout stage. Determines the teams that ADVANCED out of the prior
 * round (i.e. winners of all matches in the stage that feeds into stageKey).
 *
 * Mapping:
 *  - stageKey 'r16'      → winners of stage 'r32'
 *  - stageKey 'qf'       → winners of stage 'r16'
 *  - stageKey 'sf'       → winners of stage 'qf'
 *  - stageKey 'final'    → winners of stage 'sf' (both finalists)
 *  - stageKey 'champion' → winner of stage 'final'
 */
export async function closeKnockoutStage(formData: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = closeKnockoutSchema.safeParse({ stageKey: formData.get("stageKey") });
  if (!parsed.success) return { ok: false, error: "Etapa inválida." };

  const sourceStage =
    parsed.data.stageKey === "r16"
      ? "r32"
      : parsed.data.stageKey === "qf"
        ? "r16"
        : parsed.data.stageKey === "sf"
          ? "qf"
          : parsed.data.stageKey === "final"
            ? "sf"
            : "final";

  const finishedMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.stage, sourceStage), eq(matches.status, "finished")));
  if (finishedMatches.length === 0) {
    return { ok: false, error: "No hay partidos finalizados en la ronda anterior." };
  }
  const winners = finishedMatches
    .map((m) => m.winnerTeamId)
    .filter((x): x is number => x != null);

  await recomputeBracketStageForAllUsers(parsed.data.stageKey, winners);

  await logAdminAction({
    adminId: me.id,
    action: "ops.close_knockout",
    payload: { stage: parsed.data.stageKey, winners: winners.length },
  });
  revalidatePath("/ranking");
  return {
    ok: true,
    message: `Ronda ${parsed.data.stageKey} cerrada con ${winners.length} clasificados.`,
  };
}

/**
 * Close the tournament: compute the official top scorer ranking from
 * match_scorers and trigger top scorer scoring.
 */
export async function closeTopScorer(): Promise<FormState> {
  const me = await requireAdmin();
  const rows = await db
    .select({
      playerId: matchScorers.playerId,
      goals: sql<number>`count(*)::int`,
    })
    .from(matchScorers)
    .where(eq(matchScorers.isOwnGoal, false))
    .groupBy(matchScorers.playerId)
    .orderBy(sql`count(*) desc, ${matchScorers.playerId} asc`);

  const ranking = rows.map((r) => r.playerId);
  if (ranking.length === 0) {
    return { ok: false, error: "Sin goleadores registrados." };
  }
  await recomputeTopScorerForAllUsers(ranking);
  await logAdminAction({
    adminId: me.id,
    action: "ops.close_top_scorer",
    payload: { winnerPlayerId: ranking[0] },
  });
  revalidatePath("/ranking");
  revalidatePath("/goleadores");
  return { ok: true, message: `Bota de Oro: jugador #${ranking[0]} con ${rows[0].goals} goles.` };
}

export async function recomputeEverything(): Promise<FormState> {
  const me = await requireAdmin();
  await recomputeAllScoring();
  await logAdminAction({ adminId: me.id, action: "ops.recompute_all" });
  revalidatePath("/ranking");
  return { ok: true, message: "Recalculado todo el sistema de puntos." };
}

/**
 * Borrón total del points_ledger: pone a cero las puntuaciones de todos
 * los participantes. Las predicciones siguen ahí; los puntos se pueden
 * recalcular con "Recalcular todo" o se irán reasignando a medida que
 * el admin guarde resultados.
 *
 * Útil sobre todo en pruebas: dejar el ranking limpio antes de empezar
 * el torneo, o entre pruebas E2E. NO afecta a group_standings (que
 * refleja resultados de partidos, no puntos de usuario).
 */
export async function resetAllPoints(): Promise<FormState> {
  const me = await requireAdmin();
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(pointsLedger);
  await db.delete(pointsLedger);
  await logAdminAction({
    adminId: me.id,
    action: "ops.reset_all_points",
    payload: { wiped: count },
  });
  revalidatePath("/", "layout");
  return {
    ok: true,
    message: `Puntuaciones a cero. ${count} entradas borradas del ledger.`,
  };
}
