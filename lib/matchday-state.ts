import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";

export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
export type MatchdayState = "waiting" | "open" | "closed";

const PREDECESSOR: Record<Stage, Stage | null> = {
  group: null,
  r32: "group",
  r16: "r32",
  qf: "r16",
  sf: "qf",
  third: "sf",
  final: "sf",
};

const STAGE_LABEL: Record<Stage, string> = {
  group: "la fase de grupos",
  r32: "los dieciseisavos",
  r16: "los octavos",
  qf: "los cuartos",
  sf: "las semifinales",
  third: "el partido por el tercer puesto",
  final: "la final",
};

export type MatchdayInput = {
  stage: Stage;
  predictionDeadlineAt: Date | string;
};

export type MatchdayStatus = {
  state: MatchdayState;
  reason?: string;
};

type StageStat = {
  total: number;
  unfinished: number;
  /** Partidos del stage cuyo home/away aún no está resuelto. */
  unmatched: number;
};

async function loadStageStats(): Promise<Map<Stage, StageStat>> {
  const rows = await db
    .select({
      stage: matches.stage,
      total: sql<number>`count(*)::int`,
      unfinished: sql<number>`count(*) filter (where status != 'finished')::int`,
      unmatched: sql<number>`count(*) filter (where home_team_id is null or away_team_id is null)::int`,
    })
    .from(matches)
    .groupBy(matches.stage);
  return new Map(
    rows.map((r) => [
      r.stage as Stage,
      { total: r.total, unfinished: r.unfinished, unmatched: r.unmatched },
    ]),
  );
}

function resolveState(
  matchday: MatchdayInput,
  stats: Map<Stage, StageStat>,
): MatchdayStatus {
  const deadline = new Date(matchday.predictionDeadlineAt);
  if (deadline.getTime() <= Date.now()) {
    return { state: "closed" };
  }
  const predecessor = PREDECESSOR[matchday.stage];
  if (predecessor) {
    const predStat = stats.get(predecessor);
    if (!predStat || predStat.total === 0 || predStat.unfinished > 0) {
      return {
        state: "waiting",
        reason: `Se activa cuando termine ${STAGE_LABEL[predecessor]}.`,
      };
    }
  }
  // Para jornadas KO, además exigimos que TODOS los partidos del stage
  // tengan home y away resueltos. Si no, las predicciones por partido no
  // tendrían contra quién jugar.
  if (matchday.stage !== "group") {
    const ownStat = stats.get(matchday.stage);
    if (ownStat && ownStat.unmatched > 0) {
      return {
        state: "waiting",
        reason:
          matchday.stage === "r32"
            ? "Se activa cuando el admin ubique las mejores terceras en el bracket."
            : `Se activa cuando se conozcan los emparejamientos de ${STAGE_LABEL[matchday.stage]}.`,
      };
    }
  }
  return { state: "open" };
}

/** Compute the state of a single matchday. */
export async function getMatchdayState(matchday: MatchdayInput): Promise<MatchdayStatus> {
  const stats = await loadStageStats();
  return resolveState(matchday, stats);
}

/** Compute states for many matchdays in a single round-trip. */
export async function computeMatchdayStates<T extends MatchdayInput>(
  matchdays: T[],
): Promise<(T & MatchdayStatus)[]> {
  const stats = await loadStageStats();
  return matchdays.map((m) => ({ ...m, ...resolveState(m, stats) }));
}
