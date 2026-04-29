import { describe, expect, it } from "vitest";
import {
  scoreMatchResultPrediction,
  scoreMatchScorerPrediction,
  type MatchOutcome,
} from "../match";
import { DEFAULT_SCORING_RULES } from "../defaults";
import type { ScoringRules } from "../types";

const rules = DEFAULT_SCORING_RULES as ScoringRules;

const baseGroupMatch: MatchOutcome = {
  matchId: 1,
  stage: "group",
  homeScore: 2,
  awayScore: 1,
  wentToPens: false,
  winnerTeamId: 10,
  scorers: [{ playerId: 100, teamId: 10, isFirstGoal: true }],
};

describe("scoreMatchResultPrediction (group stage)", () => {
  it("awards 5 pts for exact score", () => {
    const entries = scoreMatchResultPrediction({
      match: baseGroupMatch,
      prediction: {
        matchId: 1,
        homeScore: 2,
        awayScore: 1,
        willGoToPens: false,
        winnerTeamId: null,
      },
      rules,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("match_exact_score");
    expect(entries[0].points).toBe(5);
  });

  it("awards 2 pts when winner is correct but score is wrong", () => {
    const entries = scoreMatchResultPrediction({
      match: baseGroupMatch,
      prediction: {
        matchId: 1,
        homeScore: 3,
        awayScore: 0,
        willGoToPens: false,
        winnerTeamId: null,
      },
      rules,
    });
    expect(entries[0].source).toBe("match_outcome");
    expect(entries[0].points).toBe(2);
  });

  it("awards 0 when prediction is wrong outcome", () => {
    const entries = scoreMatchResultPrediction({
      match: baseGroupMatch,
      prediction: {
        matchId: 1,
        homeScore: 0,
        awayScore: 2,
        willGoToPens: false,
        winnerTeamId: null,
      },
      rules,
    });
    expect(entries).toHaveLength(0);
  });
});

describe("scoreMatchResultPrediction (knockout stage)", () => {
  const koMatch: MatchOutcome = {
    matchId: 2,
    stage: "r16",
    homeScore: 1,
    awayScore: 1,
    wentToPens: true,
    winnerTeamId: 20,
    scorers: [],
  };

  it("awards qualifier + pens bonus for correct guess", () => {
    const entries = scoreMatchResultPrediction({
      match: koMatch,
      prediction: {
        matchId: 2,
        homeScore: 1,
        awayScore: 1,
        willGoToPens: true,
        winnerTeamId: 20,
      },
      rules,
    });
    const totals = entries.reduce((s, e) => s + e.points, 0);
    // 5 (exact 90' score) + 3 (qualifier) + 2 (pens bonus) = 10
    expect(totals).toBe(10);
    expect(entries.find((e) => e.source === "knockout_score_90")).toBeDefined();
    expect(entries.find((e) => e.source === "knockout_qualifier")?.points).toBe(3);
    expect(entries.find((e) => e.source === "knockout_pens_bonus")?.points).toBe(2);
  });

  it("does not award pens bonus if user predicted no pens", () => {
    const entries = scoreMatchResultPrediction({
      match: koMatch,
      prediction: {
        matchId: 2,
        homeScore: 1,
        awayScore: 1,
        willGoToPens: false,
        winnerTeamId: 20,
      },
      rules,
    });
    expect(entries.find((e) => e.source === "knockout_pens_bonus")).toBeUndefined();
  });

  it("awards qualifier even if 90' result was wrong", () => {
    const entries = scoreMatchResultPrediction({
      match: koMatch,
      prediction: {
        matchId: 2,
        homeScore: 3,
        awayScore: 0,
        willGoToPens: false,
        winnerTeamId: 20,
      },
      rules,
    });
    expect(entries.find((e) => e.source === "knockout_qualifier")).toBeDefined();
  });
});

describe("scoreMatchScorerPrediction", () => {
  const match: MatchOutcome = {
    matchId: 3,
    stage: "group",
    homeScore: 3,
    awayScore: 0,
    wentToPens: false,
    winnerTeamId: 30,
    scorers: [
      { playerId: 100, teamId: 30, isFirstGoal: true },
      { playerId: 101, teamId: 30, isFirstGoal: false },
      { playerId: 102, teamId: 30, isFirstGoal: false },
    ],
  };

  it("awards 4 pts when player scored", () => {
    const entries = scoreMatchScorerPrediction({
      match,
      prediction: { matchId: 3, playerId: 101 },
      rules,
    });
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe("match_scorer");
    expect(entries[0].points).toBe(4);
  });

  it("awards 4 + 2 = 6 pts when player scored first", () => {
    const entries = scoreMatchScorerPrediction({
      match,
      prediction: { matchId: 3, playerId: 100 },
      rules,
    });
    expect(entries).toHaveLength(2);
    const total = entries.reduce((s, e) => s + e.points, 0);
    expect(total).toBe(6);
  });

  it("awards 0 when player did not score", () => {
    const entries = scoreMatchScorerPrediction({
      match,
      prediction: { matchId: 3, playerId: 999 },
      rules,
    });
    expect(entries).toHaveLength(0);
  });
});
