import { describe, expect, it } from "vitest";
import { compareForRanking, type TiebreakerStats } from "../tiebreaker";

const base = (override: Partial<TiebreakerStats>): TiebreakerStats => ({
  userId: "u",
  totalPoints: 0,
  exactScoresCount: 0,
  knockoutPoints: 0,
  championCorrect: false,
  ...override,
});

describe("compareForRanking", () => {
  it("higher total points wins", () => {
    const a = base({ totalPoints: 100 });
    const b = base({ totalPoints: 90 });
    expect(compareForRanking(a, b)).toBeLessThan(0);
  });

  it("ties on total → more exact scores wins", () => {
    const a = base({ totalPoints: 80, exactScoresCount: 6 });
    const b = base({ totalPoints: 80, exactScoresCount: 4 });
    expect(compareForRanking(a, b)).toBeLessThan(0);
  });

  it("ties on total + exacts → more knockout points wins", () => {
    const a = base({ totalPoints: 80, exactScoresCount: 4, knockoutPoints: 50 });
    const b = base({ totalPoints: 80, exactScoresCount: 4, knockoutPoints: 30 });
    expect(compareForRanking(a, b)).toBeLessThan(0);
  });

  it("everything tied → champion correct wins", () => {
    const a = base({ totalPoints: 80, exactScoresCount: 4, knockoutPoints: 50, championCorrect: true });
    const b = base({ totalPoints: 80, exactScoresCount: 4, knockoutPoints: 50, championCorrect: false });
    expect(compareForRanking(a, b)).toBeLessThan(0);
  });

  it("complete tie returns 0", () => {
    expect(
      compareForRanking(
        base({ totalPoints: 50, exactScoresCount: 3, knockoutPoints: 10, championCorrect: true }),
        base({ totalPoints: 50, exactScoresCount: 3, knockoutPoints: 10, championCorrect: true }),
      ),
    ).toBe(0);
  });
});
