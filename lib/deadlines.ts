import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches, predMatchResult } from "@/lib/db/schema";
import { computeMatchdayStates, type Stage } from "@/lib/matchday-state";

const SOON_MS = 24 * 60 * 60 * 1000;

export type PendingDeadline = {
  kind: "matchday";
  href: string;
  label: string;
  /** ISO string of when it closes */
  closesAt: string;
  /** Milliseconds remaining at the time of computation */
  msRemaining: number;
  /** How many sub-items this user still needs to fill in for this deadline */
  missing: number;
};

/**
 * Quick summary used by the shell to drive the closing-soon banner and the
 * "predicciones" badge in the bottom nav. Returns:
 *   - `imminent`: the most urgent pending deadline within the next 24h that
 *     the user hasn't completed (null if there isn't one)
 *   - `pendingCount`: how many distinct pending items there are open right
 *     now across matchdays + per-match scorers (used as the nav badge)
 */
export async function loadDeadlineSummary(userId: string): Promise<{
  imminent: PendingDeadline | null;
  pendingCount: number;
}> {
  const now = new Date();
  const soonCutoff = new Date(now.getTime() + SOON_MS);

  const days = await db
    .select()
    .from(matchdays)
    .where(gt(matchdays.predictionDeadlineAt, now))
    .orderBy(asc(matchdays.predictionDeadlineAt));

  // Filter matchdays to ones the user can still predict (open state) and still
  // has incomplete predictions for.
  const annotated = await computeMatchdayStates(
    days.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage as Stage,
      predictionDeadlineAt: d.predictionDeadlineAt,
    })),
  );

  // Aggregate counts in two queries instead of 2*N (this runs in the (app)
  // layout on every navigation; the N+1 was a real load issue with 9
  // matchdays open at once pre-tournament).
  const openIds = annotated.filter((m) => m.state === "open").map((m) => m.id);
  const [totalsByDay, filledByDay] =
    openIds.length === 0
      ? [new Map<number, number>(), new Map<number, number>()]
      : await Promise.all([
          db
            .select({
              matchdayId: matches.matchdayId,
              total: sql<number>`count(*)::int`,
            })
            .from(matches)
            .where(inArray(matches.matchdayId, openIds))
            .groupBy(matches.matchdayId)
            .then(
              (rows) =>
                new Map(rows.map((r) => [r.matchdayId ?? 0, r.total])),
            ),
          db
            .select({
              matchdayId: matches.matchdayId,
              filled: sql<number>`count(*)::int`,
            })
            .from(predMatchResult)
            .innerJoin(matches, eq(matches.id, predMatchResult.matchId))
            .where(
              and(
                eq(predMatchResult.userId, userId),
                inArray(matches.matchdayId, openIds),
              ),
            )
            .groupBy(matches.matchdayId)
            .then(
              (rows) =>
                new Map(rows.map((r) => [r.matchdayId ?? 0, r.filled])),
            ),
        ]);

  const matchdayMissing: { matchday: typeof annotated[number]; missing: number }[] = [];
  for (const m of annotated) {
    if (m.state !== "open") continue;
    const total = totalsByDay.get(m.id) ?? 0;
    const filled = filledByDay.get(m.id) ?? 0;
    const missing = total - filled;
    if (missing > 0) {
      matchdayMissing.push({ matchday: m, missing });
    }
  }

  const pendingCount = matchdayMissing.reduce((s, x) => s + x.missing, 0);

  // Pick the most urgent imminent (closing < 24h).
  const candidates: PendingDeadline[] = [];
  for (const { matchday, missing } of matchdayMissing) {
    const closes = new Date(matchday.predictionDeadlineAt);
    if (closes.getTime() <= soonCutoff.getTime()) {
      candidates.push({
        kind: "matchday",
        href: `/predicciones/jornada/${matchday.id}`,
        label: matchday.name,
        closesAt: closes.toISOString(),
        msRemaining: closes.getTime() - now.getTime(),
        missing,
      });
    }
  }
  candidates.sort((a, b) => a.msRemaining - b.msRemaining);

  return {
    imminent: candidates[0] ?? null,
    pendingCount,
  };
}

export function formatRemaining(ms: number): string {
  if (ms <= 0) return "ya cerrado";
  const totalMin = Math.floor(ms / 60000);
  if (totalMin < 60) return `${totalMin} min`;
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours < 24) {
    return mins > 0 ? `${hours} h ${mins} min` : `${hours} h`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours > 0 ? `${days}d ${restHours}h` : `${days}d`;
}
