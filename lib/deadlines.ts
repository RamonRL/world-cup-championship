import { and, asc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchdays,
  matches,
  predMatchResult,
  predMatchScorer,
} from "@/lib/db/schema";
import { computeMatchdayStates, type Stage } from "@/lib/matchday-state";

const SOON_MS = 24 * 60 * 60 * 1000;

export type PendingDeadline = {
  kind: "matchday" | "match_scorer";
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

  const [days, upcomingMatches, myResultPreds, myScorerPreds] = await Promise.all([
    db
      .select()
      .from(matchdays)
      .where(gt(matchdays.predictionDeadlineAt, now))
      .orderBy(asc(matchdays.predictionDeadlineAt)),
    db
      .select({
        id: matches.id,
        scheduledAt: matches.scheduledAt,
        homeTeamId: matches.homeTeamId,
        awayTeamId: matches.awayTeamId,
      })
      .from(matches)
      .where(gt(matches.scheduledAt, now))
      .orderBy(asc(matches.scheduledAt)),
    db
      .select({ matchId: predMatchResult.matchId })
      .from(predMatchResult)
      .where(eq(predMatchResult.userId, userId)),
    db
      .select({ matchId: predMatchScorer.matchId })
      .from(predMatchScorer)
      .where(eq(predMatchScorer.userId, userId)),
  ]);

  const myResultMatchIds = new Set(myResultPreds.map((r) => r.matchId));
  const myScorerMatchIds = new Set(myScorerPreds.map((r) => r.matchId));

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

  const matchdayMissing: { matchday: typeof annotated[number]; missing: number }[] = [];
  for (const m of annotated) {
    if (m.state !== "open") continue;
    const matchesInDay = upcomingMatches.filter(
      (x) => x.scheduledAt && x.id && days.some((d) => d.id === m.id),
    );
    // Re-fetch matches in this matchday cheaply by counting predictions vs
    // total matches assigned. Use a single SQL query for accuracy.
    const [{ total }] = await db
      .select({ total: sql<number>`count(*)::int` })
      .from(matches)
      .where(eq(matches.matchdayId, m.id));
    const myFilledForDay = await db
      .select({ matchId: predMatchResult.matchId })
      .from(predMatchResult)
      .innerJoin(matches, eq(matches.id, predMatchResult.matchId))
      .where(and(eq(predMatchResult.userId, userId), eq(matches.matchdayId, m.id)));
    const missing = total - myFilledForDay.length;
    if (missing > 0) {
      matchdayMissing.push({ matchday: m, missing });
    }
    void matchesInDay;
  }

  // Per-match scorer picks pending: any future match the user hasn't picked yet
  const scorerMissingMatches = upcomingMatches.filter((m) => {
    if (m.homeTeamId == null || m.awayTeamId == null) return false;
    return !myScorerMatchIds.has(m.id);
  });

  const pendingCount =
    matchdayMissing.reduce((s, x) => s + x.missing, 0) + scorerMissingMatches.length;

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
  for (const m of scorerMissingMatches) {
    const closes = new Date(m.scheduledAt);
    if (closes.getTime() <= soonCutoff.getTime()) {
      candidates.push({
        kind: "match_scorer",
        href: `/predicciones/partido/${m.id}`,
        label: "Goleador del partido",
        closesAt: closes.toISOString(),
        msRemaining: closes.getTime() - now.getTime(),
        missing: 1,
      });
    }
  }
  candidates.sort((a, b) => a.msRemaining - b.msRemaining);

  // Use a flag intentionally unused to avoid lint warnings; kept for clarity.
  void myResultMatchIds;

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
