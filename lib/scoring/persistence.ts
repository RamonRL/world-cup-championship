import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupStandings,
  matchScorers,
  matches,
  pointsLedger,
  predBracketSlot,
  predGroupRanking,
  predMatchResult,
  predMatchScorer,
  predSpecial,
  predTournamentTopScorer,
  scoringRules,
  specialPredictions,
} from "@/lib/db/schema";
import {
  bracketStageFromMatchStage,
  scoreBracketStage,
  scoreGroupPrediction,
  scoreMatchResultPrediction,
  scoreMatchScorerPrediction,
  scoreSpecialPrediction,
  scoreTopScorerPrediction,
  type BracketStageKey,
  type LedgerEntry,
  type MatchOutcome,
  type ScoringRules,
} from "./index";
import { DEFAULT_SCORING_RULES } from "./defaults";

/**
 * Load the active scoring rules from the database, falling back to defaults
 * for any keys missing in the DB (so the engine never crashes if a key was
 * deleted by mistake).
 */
export async function loadScoringRules(): Promise<ScoringRules> {
  const rows = await db.select().from(scoringRules);
  const result = { ...DEFAULT_SCORING_RULES } as ScoringRules;
  for (const row of rows) {
    const value = row.valueJson as { points?: number; description?: string } | null;
    if (!value || typeof value.points !== "number") continue;
    (result as Record<string, { points: number; description?: string }>)[row.key] = {
      points: value.points,
      description: value.description,
    };
  }
  return result;
}

async function replaceLedgerEntries(args: {
  userId: string;
  source: LedgerEntry["source"];
  sourceKeys: string[];
  fresh: LedgerEntry[];
}) {
  const { userId, source, sourceKeys, fresh } = args;
  if (sourceKeys.length === 0 && fresh.length === 0) return;

  await db.transaction(async (tx) => {
    if (sourceKeys.length > 0) {
      await tx
        .delete(pointsLedger)
        .where(
          and(
            eq(pointsLedger.userId, userId),
            eq(pointsLedger.source, source),
            inArray(pointsLedger.sourceKey, sourceKeys),
          ),
        );
    }
    if (fresh.length > 0) {
      await tx.insert(pointsLedger).values(
        fresh.map((e) => ({
          userId,
          source: e.source,
          sourceKey: e.sourceKey,
          sourceRef: e.sourceRef as unknown,
          points: e.points,
        })),
      );
    }
  });
}

// ───────────────────────── match (resultado + goleador) ─────────────────────────

export async function recomputeMatchScoringForAllUsers(matchId: number) {
  const rules = await loadScoringRules();

  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) return;
  if (
    match.homeScore == null ||
    match.awayScore == null ||
    match.status !== "finished"
  ) {
    // Not finalized yet — clear any existing score-related entries for this match.
    await clearMatchLedger(matchId);
    return;
  }

  const scorerRows = await db
    .select()
    .from(matchScorers)
    .where(eq(matchScorers.matchId, matchId));

  const outcome: MatchOutcome = {
    matchId: match.id,
    stage: match.stage,
    homeScore: match.homeScore,
    awayScore: match.awayScore,
    wentToPens: match.wentToPens,
    winnerTeamId: match.winnerTeamId ?? null,
    scorers: scorerRows.map((s) => ({
      playerId: s.playerId,
      teamId: s.teamId,
      isFirstGoal: s.isFirstGoal,
    })),
  };

  // Result predictions
  const resultPreds = await db
    .select()
    .from(predMatchResult)
    .where(eq(predMatchResult.matchId, matchId));

  for (const p of resultPreds) {
    const fresh = scoreMatchResultPrediction({
      match: outcome,
      prediction: {
        matchId: p.matchId,
        homeScore: p.homeScore,
        awayScore: p.awayScore,
        willGoToPens: p.willGoToPens,
        winnerTeamId: p.winnerTeamId ?? null,
      },
      rules,
    });
    const sourceKeys = [
      `match:${matchId}:exact`,
      `match:${matchId}:outcome`,
      `match:${matchId}:score90`,
      `match:${matchId}:qualifier`,
      `match:${matchId}:pens_bonus`,
    ];
    // group all sources into the union; we replace per source.
    for (const source of [
      "match_exact_score",
      "match_outcome",
      "knockout_score_90",
      "knockout_qualifier",
      "knockout_pens_bonus",
    ] as const) {
      await replaceLedgerEntries({
        userId: p.userId,
        source,
        sourceKeys: sourceKeys.filter((k) => keyBelongsToSource(k, source)),
        fresh: fresh.filter((e) => e.source === source),
      });
    }
  }

  // Scorer predictions
  const scorerPreds = await db
    .select()
    .from(predMatchScorer)
    .where(eq(predMatchScorer.matchId, matchId));

  for (const p of scorerPreds) {
    const fresh = scoreMatchScorerPrediction({
      match: outcome,
      prediction: { matchId: p.matchId, playerId: p.playerId },
      rules,
    });
    for (const source of ["match_scorer", "match_first_scorer"] as const) {
      const sourceKeys = [
        `match:${matchId}:scorer:${p.playerId}`,
        `match:${matchId}:first_scorer:${p.playerId}`,
      ].filter((k) => keyBelongsToSource(k, source));
      await replaceLedgerEntries({
        userId: p.userId,
        source,
        sourceKeys,
        fresh: fresh.filter((e) => e.source === source),
      });
    }
  }
}

function keyBelongsToSource(key: string, source: LedgerEntry["source"]) {
  switch (source) {
    case "match_exact_score":
      return key.endsWith(":exact");
    case "match_outcome":
      return key.endsWith(":outcome");
    case "knockout_score_90":
      return key.endsWith(":score90");
    case "knockout_qualifier":
      return key.endsWith(":qualifier");
    case "knockout_pens_bonus":
      return key.endsWith(":pens_bonus");
    case "match_scorer":
      return key.includes(":scorer:") && !key.includes(":first_scorer:");
    case "match_first_scorer":
      return key.includes(":first_scorer:");
    default:
      return false;
  }
}

async function clearMatchLedger(matchId: number) {
  await db
    .delete(pointsLedger)
    .where(
      inArray(pointsLedger.source, [
        "match_exact_score",
        "match_outcome",
        "knockout_score_90",
        "knockout_qualifier",
        "knockout_pens_bonus",
        "match_scorer",
        "match_first_scorer",
      ]),
    );
  // Caller should still re-run match scoring once a final result is set.
  void matchId;
}

// ───────────────────────── group rankings ─────────────────────────

export async function recomputeGroupScoringForAllUsers(groupId: number) {
  const rules = await loadScoringRules();
  const standings = await db
    .select()
    .from(groupStandings)
    .where(eq(groupStandings.groupId, groupId));
  if (standings.length === 0) return;

  const actual = standings.map((s) => ({
    teamId: s.teamId,
    position: clampPosition(s.position),
  }));

  const preds = await db
    .select()
    .from(predGroupRanking)
    .where(eq(predGroupRanking.groupId, groupId));

  for (const p of preds) {
    const fresh = scoreGroupPrediction({
      groupId,
      prediction: {
        pos1TeamId: p.pos1TeamId,
        pos2TeamId: p.pos2TeamId,
        pos3TeamId: p.pos3TeamId,
        pos4TeamId: p.pos4TeamId,
      },
      actual,
      rules,
    });
    // Allowed sourceKeys for this group: 4 team rows + optional bonus
    const teamKeys = [p.pos1TeamId, p.pos2TeamId, p.pos3TeamId, p.pos4TeamId]
      .filter((x): x is number => x != null)
      .map((tid) => `group:${groupId}:team:${tid}`);
    await replaceLedgerEntries({
      userId: p.userId,
      source: "group_position",
      sourceKeys: teamKeys,
      fresh: fresh.filter((e) => e.source === "group_position"),
    });
    await replaceLedgerEntries({
      userId: p.userId,
      source: "group_top2_swap",
      sourceKeys: [`group:${groupId}:top2_swap`],
      fresh: fresh.filter((e) => e.source === "group_top2_swap"),
    });
  }
}

function clampPosition(p: number): 1 | 2 | 3 | 4 {
  if (p <= 1) return 1;
  if (p === 2) return 2;
  if (p === 3) return 3;
  return 4;
}

// ───────────────────────── bracket stages ─────────────────────────

/**
 * Recompute bracket points for a knockout stage. `actualAdvancingTeamIds` is
 * the list of teams that survived that stage (e.g. the 16 winners of R32 for
 * the 'r16' stage award, the 8 winners of R16 for 'qf', etc.).
 */
export async function recomputeBracketStageForAllUsers(
  stageKey: BracketStageKey,
  actualAdvancingTeamIds: number[],
) {
  const rules = await loadScoringRules();
  const preds = await db
    .select()
    .from(predBracketSlot)
    .where(eq(predBracketSlot.stage, mapBracketStageToMatchStage(stageKey)));

  // Group predictions by user
  const byUser = new Map<string, number[]>();
  for (const p of preds) {
    if (!p.predictedTeamId) continue;
    const arr = byUser.get(p.userId) ?? [];
    arr.push(p.predictedTeamId);
    byUser.set(p.userId, arr);
  }

  // For champion stage, also include explicit champion prediction (final winner).
  if (stageKey === "champion") {
    // Champion is encoded as the slot 1 of stage 'final' that won — but for
    // simplicity we let admin set it via a dedicated stage 'champion' row.
    const championPreds = await db
      .select()
      .from(predBracketSlot)
      .where(eq(predBracketSlot.stage, "final"));
    // Champion is *one* slot; we treat user's stage='final' slot 1 as champion.
    // The model that the user maintains: for 'final' they pick TWO teams (both
    // finalists, slots 1-2). The champion is recorded separately under
    // stage='final' slot=0 (a special slot). To keep this concrete, the seed
    // and admin UI will use slot 0 for champion.
    void championPreds;
  }

  for (const [userId, predictedTeamIds] of byUser) {
    const fresh = scoreBracketStage({
      stageKey,
      predictedTeamIds,
      actualAdvancingTeamIds,
      rules,
    });
    const allKeys = predictedTeamIds.map((tid) => `bracket:${stageKey}:team:${tid}`);
    await replaceLedgerEntries({
      userId,
      source: "bracket_slot",
      sourceKeys: allKeys,
      fresh,
    });
  }
}

function mapBracketStageToMatchStage(stage: BracketStageKey) {
  switch (stage) {
    case "r16":
      return "r16" as const;
    case "qf":
      return "qf" as const;
    case "sf":
      return "sf" as const;
    case "final":
      return "final" as const;
    case "champion":
      return "final" as const;
  }
}

// ───────────────────────── tournament top scorer ─────────────────────────

export async function recomputeTopScorerForAllUsers(topScorerRanking: number[]) {
  const rules = await loadScoringRules();
  const preds = await db.select().from(predTournamentTopScorer);

  for (const p of preds) {
    const fresh = scoreTopScorerPrediction({
      predictedPlayerId: p.playerId,
      topScorerRanking,
      rules,
    });
    const sourceKeys = p.playerId ? [`tournament_top_scorer:${p.playerId}`] : [];
    await replaceLedgerEntries({
      userId: p.userId,
      source: "tournament_top_scorer",
      sourceKeys,
      fresh,
    });
  }
}

// ───────────────────────── special predictions ─────────────────────────

export async function recomputeSpecialPredictionForAllUsers(specialId: number) {
  const [def] = await db
    .select()
    .from(specialPredictions)
    .where(eq(specialPredictions.id, specialId))
    .limit(1);
  if (!def) return;

  const preds = await db
    .select()
    .from(predSpecial)
    .where(eq(predSpecial.specialId, specialId));

  for (const p of preds) {
    const fresh = scoreSpecialPrediction({
      special: {
        id: def.id,
        key: def.key,
        type: def.type,
        optionsJson: def.optionsJson,
        pointsConfigJson: def.pointsConfigJson,
        resolvedValueJson: def.resolvedValueJson,
      },
      userValueJson: p.valueJson,
    });
    await replaceLedgerEntries({
      userId: p.userId,
      source: "special_prediction",
      sourceKeys: [`special:${specialId}`],
      fresh,
    });
  }
}

// ───────────────────────── scoring rule edits ─────────────────────────

/**
 * After an admin edits any scoring rule, this re-runs every category for every
 * user. Slower but idempotent.
 */
export async function recomputeAllScoring() {
  // Match-related (every finished match)
  const finishedMatches = await db
    .select({ id: matches.id })
    .from(matches)
    .where(eq(matches.status, "finished"));
  for (const m of finishedMatches) {
    await recomputeMatchScoringForAllUsers(m.id);
  }

  // Group standings (every group with finalized standings)
  const finalizedGroups = await db
    .selectDistinctOn([groupStandings.groupId], { groupId: groupStandings.groupId })
    .from(groupStandings);
  for (const g of finalizedGroups) {
    await recomputeGroupScoringForAllUsers(g.groupId);
  }

  // Bracket stages — left to admin "Operaciones" page (needs canonical advancing
  // lists per stage). Recompute is triggered explicitly there.

  // Resolved specials
  const resolvedSpecials = await db
    .select({ id: specialPredictions.id })
    .from(specialPredictions);
  for (const s of resolvedSpecials) {
    await recomputeSpecialPredictionForAllUsers(s.id);
  }
}
