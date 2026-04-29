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
  const groupMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.stage, "group"), eq(matches.status, "finished")));
  if (groupMatches.length === 0) {
    return { ok: false, error: "No hay partidos de fase de grupos finalizados." };
  }

  // Aggregate per (groupId, teamId)
  type Agg = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
  };
  const agg = new Map<string, Agg & { groupId: number; teamId: number }>();
  function ensure(groupId: number, teamId: number) {
    const key = `${groupId}-${teamId}`;
    const existing = agg.get(key);
    if (existing) return existing;
    const fresh = {
      groupId,
      teamId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      points: 0,
    };
    agg.set(key, fresh);
    return fresh;
  }

  for (const m of groupMatches) {
    if (m.groupId == null || m.homeTeamId == null || m.awayTeamId == null) continue;
    if (m.homeScore == null || m.awayScore == null) continue;
    const home = ensure(m.groupId, m.homeTeamId);
    const away = ensure(m.groupId, m.awayTeamId);
    home.played += 1;
    away.played += 1;
    home.goalsFor += m.homeScore;
    home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore;
    away.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) {
      home.won += 1;
      home.points += 3;
      away.lost += 1;
    } else if (m.homeScore < m.awayScore) {
      away.won += 1;
      away.points += 3;
      home.lost += 1;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }
  }

  // Sort within each group: pts desc, GD desc, GF desc; assign 1..N positions.
  const byGroup = new Map<number, (typeof agg extends Map<string, infer V> ? V : never)[]>();
  for (const v of agg.values()) {
    const arr = byGroup.get(v.groupId) ?? [];
    arr.push(v);
    byGroup.set(v.groupId, arr);
  }

  await db.transaction(async (tx) => {
    for (const [groupId, arr] of byGroup) {
      arr.sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points;
        const gdA = a.goalsFor - a.goalsAgainst;
        const gdB = b.goalsFor - b.goalsAgainst;
        if (gdB !== gdA) return gdB - gdA;
        return b.goalsFor - a.goalsFor;
      });
      await tx.delete(groupStandings).where(eq(groupStandings.groupId, groupId));
      for (let i = 0; i < arr.length; i++) {
        const v = arr[i];
        await tx.insert(groupStandings).values({
          groupId: v.groupId,
          teamId: v.teamId,
          position: i + 1,
          played: v.played,
          won: v.won,
          drawn: v.drawn,
          lost: v.lost,
          goalsFor: v.goalsFor,
          goalsAgainst: v.goalsAgainst,
          points: v.points,
          finalizedAt: new Date(),
        });
      }
    }
  });

  for (const groupId of byGroup.keys()) {
    await recomputeGroupScoringForAllUsers(groupId);
  }

  await logAdminAction({
    adminId: me.id,
    action: "ops.close_group_stage",
    payload: { groupCount: byGroup.size },
  });

  revalidatePath("/grupos");
  revalidatePath("/ranking");
  return { ok: true, message: `Fase de grupos cerrada. ${byGroup.size} grupos calculados.` };
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
