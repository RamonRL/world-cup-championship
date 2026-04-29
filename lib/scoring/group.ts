import type { LedgerEntry, ScoringRules } from "./types";

export type GroupActualStanding = {
  teamId: number;
  position: 1 | 2 | 3 | 4;
};

export type GroupPrediction = {
  pos1TeamId: number | null;
  pos2TeamId: number | null;
  pos3TeamId: number | null;
  pos4TeamId: number | null;
};

/**
 * Compute group ranking points for a single user/group:
 *  - Per team predicted: 3 pts exact, 1 pt adjacent (±1).
 *  - Bonus +1 if the predicted top-2 (in either order) matches the actual top-2.
 *
 * Returns an array of ledger entries (one per team for position pts, plus the
 * optional bonus). Pure function — no I/O.
 */
export function scoreGroupPrediction(args: {
  groupId: number;
  prediction: GroupPrediction;
  actual: GroupActualStanding[];
  rules: ScoringRules;
}): LedgerEntry[] {
  const { groupId, prediction, actual, rules } = args;
  const entries: LedgerEntry[] = [];
  const positionByTeam = new Map<number, number>(actual.map((s) => [s.teamId, s.position]));

  const predicted: { teamId: number | null; position: 1 | 2 | 3 | 4 }[] = [
    { teamId: prediction.pos1TeamId, position: 1 },
    { teamId: prediction.pos2TeamId, position: 2 },
    { teamId: prediction.pos3TeamId, position: 3 },
    { teamId: prediction.pos4TeamId, position: 4 },
  ];

  for (const p of predicted) {
    if (!p.teamId) continue;
    const actualPos = positionByTeam.get(p.teamId);
    if (!actualPos) continue;

    let points = 0;
    if (actualPos === p.position) {
      points = rules.group_position_exact.points;
    } else if (Math.abs(actualPos - p.position) === 1) {
      points = rules.group_position_adjacent.points;
    }

    entries.push({
      source: "group_position",
      sourceKey: `group:${groupId}:team:${p.teamId}`,
      sourceRef: { groupId, teamId: p.teamId, predictedPosition: p.position, actualPos },
      points,
    });
  }

  const predictedTop2 = new Set(
    [prediction.pos1TeamId, prediction.pos2TeamId].filter((x): x is number => x != null),
  );
  const actualTop2 = new Set(
    actual.filter((s) => s.position === 1 || s.position === 2).map((s) => s.teamId),
  );
  const isExactOrder =
    prediction.pos1TeamId != null &&
    prediction.pos2TeamId != null &&
    actual.find((s) => s.position === 1)?.teamId === prediction.pos1TeamId &&
    actual.find((s) => s.position === 2)?.teamId === prediction.pos2TeamId;

  const sameSet =
    predictedTop2.size === 2 &&
    actualTop2.size === 2 &&
    [...predictedTop2].every((t) => actualTop2.has(t));

  if (sameSet && !isExactOrder) {
    entries.push({
      source: "group_top2_swap",
      sourceKey: `group:${groupId}:top2_swap`,
      sourceRef: { groupId },
      points: rules.group_top2_swap_bonus.points,
    });
  }

  return entries;
}
