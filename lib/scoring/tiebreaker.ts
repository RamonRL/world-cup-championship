/**
 * Tiebreaker resolution for the global ranking. As decided in the plan:
 *  1. More exact-score predictions
 *  2. More points earned in knockout-related categories
 *  3. Got the champion right (binary)
 *  4. Admin breaks the tie manually (no further automatic step)
 */

export type TiebreakerStats = {
  userId: string;
  totalPoints: number;
  exactScoresCount: number;
  knockoutPoints: number;
  championCorrect: boolean;
};

const KNOCKOUT_SOURCES = new Set([
  "bracket_slot",
  "knockout_qualifier",
  "knockout_pens_bonus",
  "knockout_score_90",
]);

export function isKnockoutSource(source: string) {
  return KNOCKOUT_SOURCES.has(source);
}

export function compareForRanking(a: TiebreakerStats, b: TiebreakerStats): number {
  if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
  if (b.exactScoresCount !== a.exactScoresCount) return b.exactScoresCount - a.exactScoresCount;
  if (b.knockoutPoints !== a.knockoutPoints) return b.knockoutPoints - a.knockoutPoints;
  if (a.championCorrect !== b.championCorrect) return b.championCorrect ? 1 : -1;
  return 0;
}
