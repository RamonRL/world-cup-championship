import { describe, expect, it } from "vitest";
import { scoreTopScorerPrediction } from "../top-scorer";
import { DEFAULT_SCORING_RULES } from "../defaults";
import type { ScoringRules } from "../types";

const rules = DEFAULT_SCORING_RULES as ScoringRules;

describe("scoreTopScorerPrediction", () => {
  const ranking = [10, 20, 30, 40, 50, 60];

  it("awards 15 for the exact top scorer", () => {
    const entries = scoreTopScorerPrediction({
      predictedPlayerId: 10,
      topScorerRanking: ranking,
      rules,
    });
    expect(entries[0].points).toBe(15);
  });

  it("awards 5 for 2nd or 3rd", () => {
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: 20, topScorerRanking: ranking, rules })[0]
        .points,
    ).toBe(5);
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: 30, topScorerRanking: ranking, rules })[0]
        .points,
    ).toBe(5);
  });

  it("awards 2 for 4th or 5th", () => {
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: 40, topScorerRanking: ranking, rules })[0]
        .points,
    ).toBe(2);
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: 50, topScorerRanking: ranking, rules })[0]
        .points,
    ).toBe(2);
  });

  it("awards nothing beyond top-5", () => {
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: 60, topScorerRanking: ranking, rules }),
    ).toHaveLength(0);
  });

  it("returns empty when prediction is missing", () => {
    expect(
      scoreTopScorerPrediction({ predictedPlayerId: null, topScorerRanking: ranking, rules }),
    ).toHaveLength(0);
  });
});
