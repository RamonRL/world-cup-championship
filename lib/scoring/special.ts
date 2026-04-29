import type { LedgerEntry } from "./types";

/**
 * Special predictions (categoría 6). Each special has a `type` that determines
 * how the user input and the resolved value are compared.
 */

export type SpecialType =
  | "yes_no"
  | "single_choice"
  | "team_with_round"
  | "number_range"
  | "player";

export type SpecialDef = {
  id: number;
  key: string;
  type: SpecialType;
  optionsJson: unknown;
  pointsConfigJson: unknown;
  resolvedValueJson: unknown;
};

const ROUNDS_RANK: Record<string, number> = {
  group: 0,
  r32: 1,
  r16: 2,
  qf: 3,
  sf: 4,
  final: 5,
  champion: 6,
};

export function scoreSpecialPrediction(args: {
  special: SpecialDef;
  userValueJson: unknown;
}): LedgerEntry[] {
  const { special, userValueJson } = args;
  if (special.resolvedValueJson == null || userValueJson == null) return [];

  const sourceKey = `special:${special.id}`;

  switch (special.type) {
    case "yes_no": {
      const cfg = special.pointsConfigJson as { correct: number };
      const resolved = (special.resolvedValueJson as { value: boolean }).value;
      const user = (userValueJson as { value: boolean }).value;
      if (resolved === user) {
        return [pt(special, sourceKey, cfg.correct)];
      }
      return [];
    }
    case "single_choice": {
      const cfg = special.pointsConfigJson as { correct: number };
      const resolved = (special.resolvedValueJson as { value: string | number }).value;
      const user = (userValueJson as { value: string | number }).value;
      if (resolved === user) {
        return [pt(special, sourceKey, cfg.correct)];
      }
      return [];
    }
    case "number_range": {
      const cfg = special.pointsConfigJson as { correct: number };
      const tolerance = (special.optionsJson as { tolerance: number }).tolerance ?? 0;
      const resolved = (special.resolvedValueJson as { value: number }).value;
      const user = (userValueJson as { value: number }).value;
      if (Math.abs(resolved - user) <= tolerance) {
        return [pt(special, sourceKey, cfg.correct)];
      }
      return [];
    }
    case "team_with_round": {
      // user picks a team and a maximum round it reaches.
      // Points scale with how far that team actually reached: perRound[reachedRound],
      // capped at maxPoints. Award only if user's team matches the resolved team.
      const cfg = special.pointsConfigJson as {
        maxPoints: number;
        perRound: Record<string, number>;
      };
      const resolved = special.resolvedValueJson as { teamCode: string; round: string };
      const user = userValueJson as { teamCode: string; round: string };
      if (user.teamCode !== resolved.teamCode) return [];

      const userRoundRank = ROUNDS_RANK[user.round] ?? -1;
      const resolvedRoundRank = ROUNDS_RANK[resolved.round] ?? -1;
      // Award the perRound table value for the actual round the team reached,
      // but only if the user's predicted round was equal or earlier (i.e. not
      // overshooting). If user predicted 'final' but team only reached qf,
      // award perRound['qf'] minus a haircut? Simplest fair rule: award perRound
      // of the actual round if user predicted ≤ that round, else partial credit
      // perRound of user's predicted round.
      const reachedKey = resolved.round;
      const fullPoints = cfg.perRound[reachedKey] ?? 0;
      let awarded: number;
      if (userRoundRank <= resolvedRoundRank) {
        awarded = fullPoints;
      } else {
        // Overshot — give credit only for what the team did reach.
        awarded = cfg.perRound[reachedKey] ?? 0;
      }
      const final = Math.min(awarded, cfg.maxPoints);
      return final > 0 ? [pt(special, sourceKey, final)] : [];
    }
    case "player": {
      const cfg = special.pointsConfigJson as { correct: number };
      const resolved = (special.resolvedValueJson as { playerId: number }).playerId;
      const user = (userValueJson as { playerId: number }).playerId;
      if (resolved === user) return [pt(special, sourceKey, cfg.correct)];
      return [];
    }
  }
}

function pt(special: SpecialDef, sourceKey: string, points: number): LedgerEntry {
  return {
    source: "special_prediction",
    sourceKey,
    sourceRef: { specialId: special.id, key: special.key },
    points,
  };
}
