import { describe, expect, it } from "vitest";
import { scoreBracketStage } from "../bracket";
import { DEFAULT_SCORING_RULES } from "../defaults";
import type { ScoringRules } from "../types";

const rules = DEFAULT_SCORING_RULES as ScoringRules;

describe("scoreBracketStage", () => {
  it("awards r16 points only for teams that actually advanced", () => {
    const entries = scoreBracketStage({
      stageKey: "r16",
      predictedTeamIds: [1, 2, 3, 4],
      actualAdvancingTeamIds: [1, 2, 99, 100],
      rules,
    });
    expect(entries).toHaveLength(2);
    expect(entries.every((e) => e.points === 2)).toBe(true);
  });

  it("uses correct rule per stage", () => {
    const r16 = scoreBracketStage({
      stageKey: "r16",
      predictedTeamIds: [1],
      actualAdvancingTeamIds: [1],
      rules,
    });
    const qf = scoreBracketStage({
      stageKey: "qf",
      predictedTeamIds: [1],
      actualAdvancingTeamIds: [1],
      rules,
    });
    const sf = scoreBracketStage({
      stageKey: "sf",
      predictedTeamIds: [1],
      actualAdvancingTeamIds: [1],
      rules,
    });
    const fi = scoreBracketStage({
      stageKey: "final",
      predictedTeamIds: [1],
      actualAdvancingTeamIds: [1],
      rules,
    });
    const ch = scoreBracketStage({
      stageKey: "champion",
      predictedTeamIds: [1],
      actualAdvancingTeamIds: [1],
      rules,
    });
    expect(r16[0].points).toBe(2);
    expect(qf[0].points).toBe(4);
    expect(sf[0].points).toBe(7);
    expect(fi[0].points).toBe(10);
    expect(ch[0].points).toBe(20);
  });

  it("dedupes duplicate predicted teams", () => {
    const entries = scoreBracketStage({
      stageKey: "r16",
      predictedTeamIds: [1, 1, 1],
      actualAdvancingTeamIds: [1, 2],
      rules,
    });
    expect(entries).toHaveLength(1);
  });
});
