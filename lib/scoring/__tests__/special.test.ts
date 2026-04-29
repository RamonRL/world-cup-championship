import { describe, expect, it } from "vitest";
import { scoreSpecialPrediction, type SpecialDef } from "../special";

describe("scoreSpecialPrediction", () => {
  it("yes_no awards on match", () => {
    const def: SpecialDef = {
      id: 1,
      key: "africa_in_semis",
      type: "yes_no",
      optionsJson: null,
      pointsConfigJson: { correct: 4 },
      resolvedValueJson: { value: true },
    };
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { value: true } })[0].points,
    ).toBe(4);
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { value: false } }),
    ).toHaveLength(0);
  });

  it("number_range respects tolerance", () => {
    const def: SpecialDef = {
      id: 2,
      key: "group_total_goals",
      type: "number_range",
      optionsJson: { tolerance: 5 },
      pointsConfigJson: { correct: 5 },
      resolvedValueJson: { value: 130 },
    };
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { value: 134 } })[0].points,
    ).toBe(5);
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { value: 125 } })[0].points,
    ).toBe(5);
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { value: 120 } }),
    ).toHaveLength(0);
  });

  it("team_with_round awards perRound for actual reach when team matches", () => {
    const def: SpecialDef = {
      id: 3,
      key: "host_furthest_round",
      type: "team_with_round",
      optionsJson: {
        teamCodes: ["USA", "CAN", "MEX"],
        rounds: ["group", "r32", "r16", "qf", "sf", "final", "champion"],
      },
      pointsConfigJson: {
        maxPoints: 8,
        perRound: { r32: 1, r16: 2, qf: 4, sf: 6, final: 7, champion: 8 },
      },
      resolvedValueJson: { teamCode: "USA", round: "qf" },
    };
    // User predicted USA reaches r16 → team actually reached qf → award perRound[qf] = 4
    expect(
      scoreSpecialPrediction({
        special: def,
        userValueJson: { teamCode: "USA", round: "r16" },
      })[0].points,
    ).toBe(4);

    // Wrong team
    expect(
      scoreSpecialPrediction({
        special: def,
        userValueJson: { teamCode: "MEX", round: "qf" },
      }),
    ).toHaveLength(0);

    // Capped at maxPoints
    const def2: SpecialDef = {
      ...def,
      resolvedValueJson: { teamCode: "USA", round: "champion" },
      pointsConfigJson: {
        maxPoints: 8,
        perRound: { r32: 1, r16: 2, qf: 4, sf: 6, final: 7, champion: 9 },
      },
    };
    expect(
      scoreSpecialPrediction({
        special: def2,
        userValueJson: { teamCode: "USA", round: "champion" },
      })[0].points,
    ).toBe(8);
  });

  it("returns empty when not yet resolved", () => {
    const def: SpecialDef = {
      id: 4,
      key: "best_player",
      type: "player",
      optionsJson: null,
      pointsConfigJson: { correct: 8 },
      resolvedValueJson: null,
    };
    expect(
      scoreSpecialPrediction({ special: def, userValueJson: { playerId: 1 } }),
    ).toHaveLength(0);
  });
});
