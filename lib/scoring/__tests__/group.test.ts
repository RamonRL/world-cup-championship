import { describe, expect, it } from "vitest";
import { scoreGroupPrediction } from "../group";
import { DEFAULT_SCORING_RULES } from "../defaults";
import type { ScoringRules } from "../types";

const rules = DEFAULT_SCORING_RULES as ScoringRules;

const actual = [
  { teamId: 1, position: 1 as const },
  { teamId: 2, position: 2 as const },
  { teamId: 3, position: 3 as const },
  { teamId: 4, position: 4 as const },
];

describe("scoreGroupPrediction", () => {
  it("awards 3 pts per exact match and totals all four positions", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: 1, pos2TeamId: 2, pos3TeamId: 3, pos4TeamId: 4 },
      actual,
      rules,
    });
    const total = entries.reduce((s, e) => s + e.points, 0);
    expect(total).toBe(12); // 4 exacts × 3 pts
  });

  it("awards 1 pt for adjacent positions", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: 2, pos2TeamId: 1, pos3TeamId: 4, pos4TeamId: 3 },
      actual,
      rules,
    });
    // Each prediction is off by 1 → 1pt each = 4 pts
    // Plus top2 swap bonus: predicted top-2 = {2,1}, actual top-2 = {1,2} → same set, not exact → +1
    const total = entries.reduce((s, e) => s + e.points, 0);
    expect(total).toBe(5);
  });

  it("awards top-2 swap bonus only when set matches without exact order", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: 1, pos2TeamId: 2, pos3TeamId: 4, pos4TeamId: 3 },
      actual,
      rules,
    });
    const swapEntry = entries.find((e) => e.source === "group_top2_swap");
    expect(swapEntry).toBeUndefined(); // exact order on top-2, no bonus
  });

  it("does not award swap bonus when top-2 set is wrong", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: 3, pos2TeamId: 4, pos3TeamId: 1, pos4TeamId: 2 },
      actual,
      rules,
    });
    const swapEntry = entries.find((e) => e.source === "group_top2_swap");
    expect(swapEntry).toBeUndefined();
  });

  it("zero adjacency for distance ≥2", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: 4, pos2TeamId: 3, pos3TeamId: 2, pos4TeamId: 1 },
      actual,
      rules,
    });
    // 1↔4 distance 3, 2↔3 distance 1, 3↔2 distance 1, 4↔1 distance 3
    // 0 + 1 + 1 + 0 = 2
    const total = entries
      .filter((e) => e.source === "group_position")
      .reduce((s, e) => s + e.points, 0);
    expect(total).toBe(2);
  });

  it("ignores incomplete predictions (null teamId)", () => {
    const entries = scoreGroupPrediction({
      groupId: 1,
      prediction: { pos1TeamId: null, pos2TeamId: 2, pos3TeamId: null, pos4TeamId: 4 },
      actual,
      rules,
    });
    expect(entries.filter((e) => e.source === "group_position")).toHaveLength(2);
  });
});
