import type { LedgerEntry, ScoringRules } from "./types";

/**
 * Tournament top scorer (Bota de Oro) scoring (categoría 3).
 *
 *  - Predicted player IS the official top scorer → 15 pts
 *  - Predicted player finished 2nd or 3rd  → 5 pts
 *  - Predicted player finished 4th or 5th  → 2 pts
 *  - Otherwise → 0 pts
 *
 * `topScorerRanking` is an ordered list of player ids ranked by goals (with
 * ties already resolved by FIFA's official tiebreakers — the admin enters the
 * canonical order).
 */
export function scoreTopScorerPrediction(args: {
  predictedPlayerId: number | null;
  topScorerRanking: number[];
  rules: ScoringRules;
}): LedgerEntry[] {
  const { predictedPlayerId, topScorerRanking, rules } = args;
  if (!predictedPlayerId) return [];
  const idx = topScorerRanking.indexOf(predictedPlayerId);

  let points = 0;
  if (idx === 0) points = rules.top_scorer_exact.points;
  else if (idx === 1 || idx === 2) points = rules.top_scorer_top3.points;
  else if (idx === 3 || idx === 4) points = rules.top_scorer_top5.points;
  else return [];

  return [
    {
      source: "tournament_top_scorer",
      sourceKey: `tournament_top_scorer:${predictedPlayerId}`,
      sourceRef: { predictedPlayerId, finalRank: idx + 1 },
      points,
    },
  ];
}
