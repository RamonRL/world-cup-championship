import type { LedgerEntry, ScoringRules, Stage } from "./types";

/**
 * Bracket scoring (categoría 2). Per stage, per slot, if the predicted team is
 * one of the teams that actually reached that round → award the corresponding
 * points. Slot-by-slot precision is NOT required (the user predicts who passes
 * the round, not which exact bracket slot).
 *
 * - r16: 2 pts/team ×16 teams that pass R32
 * - qf:  4 pts/team × 8 teams that pass R16
 * - sf:  7 pts/team × 4 teams that pass QF
 * - final: 10 pts/team × 2 teams that pass SF (both finalists)
 * - champion: 20 pts × 1 (final winner)
 *
 * Note: "third place" match doesn't award bracket points by design.
 */
export type BracketStageKey = "r16" | "qf" | "sf" | "final" | "champion";

const RULE_BY_STAGE: Record<BracketStageKey, keyof ScoringRules> = {
  r16: "bracket_r16",
  qf: "bracket_qf",
  sf: "bracket_sf",
  final: "bracket_final",
  champion: "bracket_champion",
};

export function scoreBracketStage(args: {
  stageKey: BracketStageKey;
  predictedTeamIds: number[];
  actualAdvancingTeamIds: number[];
  rules: ScoringRules;
}): LedgerEntry[] {
  const { stageKey, predictedTeamIds, actualAdvancingTeamIds, rules } = args;
  const ruleKey = RULE_BY_STAGE[stageKey];
  const points = rules[ruleKey].points;
  const actual = new Set(actualAdvancingTeamIds);
  const entries: LedgerEntry[] = [];
  const seen = new Set<number>();
  for (const teamId of predictedTeamIds) {
    if (seen.has(teamId)) continue;
    seen.add(teamId);
    if (actual.has(teamId)) {
      entries.push({
        source: "bracket_slot",
        sourceKey: `bracket:${stageKey}:team:${teamId}`,
        sourceRef: { stage: stageKey, teamId },
        points,
      });
    }
  }
  return entries;
}

export function bracketStageFromMatchStage(stage: Stage): BracketStageKey | null {
  switch (stage) {
    case "r16":
      return "r16";
    case "qf":
      return "qf";
    case "sf":
      return "sf";
    case "final":
      return "final";
    default:
      return null;
  }
}
