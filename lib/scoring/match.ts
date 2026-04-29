import type { LedgerEntry, ScoringRules, Stage } from "./types";

export type MatchOutcome = {
  matchId: number;
  stage: Stage;
  homeScore: number;
  awayScore: number;
  wentToPens: boolean;
  winnerTeamId: number | null;
  scorers: { playerId: number; teamId: number; isFirstGoal: boolean }[];
};

export type MatchResultPrediction = {
  matchId: number;
  homeScore: number;
  awayScore: number;
  willGoToPens: boolean;
  winnerTeamId: number | null;
};

export type MatchScorerPrediction = {
  matchId: number;
  playerId: number;
};

const isKnockout = (stage: Stage) => stage !== "group";

/**
 * Score a match-result prediction (categoría 4). Composable rules:
 * - Group stage:
 *   - Exact 90' score → match_exact_score (5)
 *   - Else, correct 90' outcome (winner/draw) → match_outcome (2)
 * - Knockout stage (90' result is what user predicted; pens decided separately):
 *   - Exact 90' score → match_exact_score (5)
 *   - Else, correct 90' outcome → match_outcome (2)
 *   - Correct qualifier (regardless of how) → knockout_qualifier (3)
 *   - Correctly predicted "will go to pens" → knockout_pens_bonus (2 extra)
 *
 * Note: in knockout the user predicts a 90' score AND who advances. They can
 * earn both score points and qualifier points on the same match.
 */
export function scoreMatchResultPrediction(args: {
  match: MatchOutcome;
  prediction: MatchResultPrediction;
  rules: ScoringRules;
}): LedgerEntry[] {
  const { match, prediction, rules } = args;
  const entries: LedgerEntry[] = [];

  const exactScore =
    prediction.homeScore === match.homeScore && prediction.awayScore === match.awayScore;

  // 90' outcome: comparing scoring sign (home vs away vs draw)
  const sign = (a: number, b: number) => (a > b ? 1 : a < b ? -1 : 0);
  const predictedSign = sign(prediction.homeScore, prediction.awayScore);
  const actualSign = sign(match.homeScore, match.awayScore);
  const correctOutcome = predictedSign === actualSign;

  if (isKnockout(match.stage)) {
    if (exactScore) {
      entries.push({
        source: "knockout_score_90",
        sourceKey: `match:${match.matchId}:score90`,
        sourceRef: { matchId: match.matchId },
        points: rules.knockout_score_90.points,
      });
    } else if (correctOutcome) {
      entries.push({
        source: "match_outcome",
        sourceKey: `match:${match.matchId}:outcome`,
        sourceRef: { matchId: match.matchId },
        points: rules.match_outcome_only.points,
      });
    }

    if (prediction.winnerTeamId && prediction.winnerTeamId === match.winnerTeamId) {
      entries.push({
        source: "knockout_qualifier",
        sourceKey: `match:${match.matchId}:qualifier`,
        sourceRef: { matchId: match.matchId, teamId: prediction.winnerTeamId },
        points: rules.knockout_qualifier.points,
      });
    }

    if (prediction.willGoToPens && match.wentToPens) {
      entries.push({
        source: "knockout_pens_bonus",
        sourceKey: `match:${match.matchId}:pens_bonus`,
        sourceRef: { matchId: match.matchId },
        points: rules.knockout_pens_bonus.points,
      });
    }
  } else {
    if (exactScore) {
      entries.push({
        source: "match_exact_score",
        sourceKey: `match:${match.matchId}:exact`,
        sourceRef: { matchId: match.matchId },
        points: rules.match_exact_score.points,
      });
    } else if (correctOutcome) {
      entries.push({
        source: "match_outcome",
        sourceKey: `match:${match.matchId}:outcome`,
        sourceRef: { matchId: match.matchId },
        points: rules.match_outcome_only.points,
      });
    }
  }

  return entries;
}

/**
 * Score per-match scorer prediction (categoría 5).
 * - 4 pts if predicted player is among the scorers of the match.
 * - +2 if predicted player scored the FIRST goal (cumulative with the 4).
 */
export function scoreMatchScorerPrediction(args: {
  match: MatchOutcome;
  prediction: MatchScorerPrediction;
  rules: ScoringRules;
}): LedgerEntry[] {
  const { match, prediction, rules } = args;
  const entries: LedgerEntry[] = [];

  const playerScored = match.scorers.some((s) => s.playerId === prediction.playerId);
  const playerScoredFirst = match.scorers.some(
    (s) => s.playerId === prediction.playerId && s.isFirstGoal,
  );

  if (playerScored) {
    entries.push({
      source: "match_scorer",
      sourceKey: `match:${match.matchId}:scorer:${prediction.playerId}`,
      sourceRef: { matchId: match.matchId, playerId: prediction.playerId },
      points: rules.match_scorer.points,
    });
  }
  if (playerScoredFirst) {
    entries.push({
      source: "match_first_scorer",
      sourceKey: `match:${match.matchId}:first_scorer:${prediction.playerId}`,
      sourceRef: { matchId: match.matchId, playerId: prediction.playerId },
      points: rules.match_first_scorer_bonus.points,
    });
  }
  return entries;
}
