import { cache } from "react";
import { and, asc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches, predMatchResult } from "@/lib/db/schema";
import { computeMatchdayStates, type Stage } from "@/lib/matchday-state";

const SOON_MS = 24 * 60 * 60 * 1000;
const DEADLINE_TIMEOUT_MS = 4000;

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

export type OpenMatchdayEntry = {
  id: number;
  name: string;
  stage: Stage;
  predictionDeadlineAt: Date;
  /** Total de partidos de la jornada (denominador del "X / Y" del usuario) */
  total: number;
  /** Predicciones que el usuario ya envió */
  filled: number;
};

/**
 * Cargador único de jornadas abiertas + cuánto lleva relleno el usuario en
 * cada una. Cacheado con React.cache() para que múltiples llamadas dentro
 * del mismo request (layout + dashboard + Progress Hub) compartan el
 * resultado y solo se pegue una vez a la DB.
 *
 * Devuelve siempre `[]` si la query revienta o tarda demasiado — la UI
 * renderiza sin banner en lugar de colgar la página.
 */
export const loadOpenMatchdays = cache(
  async (userId: string, leagueId: number): Promise<OpenMatchdayEntry[]> => {
    return new Promise<OpenMatchdayEntry[]>((resolve) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        console.error(
          `loadOpenMatchdays timeout (>${DEADLINE_TIMEOUT_MS}ms) — devolviendo []`,
        );
        resolve([]);
      }, DEADLINE_TIMEOUT_MS);
      loadOpenMatchdaysUnsafe(userId, leagueId).then(
        (v) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(v);
        },
        (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          console.error("loadOpenMatchdays failed:", err);
          resolve([]);
        },
      );
    });
  },
);

async function loadOpenMatchdaysUnsafe(
  userId: string,
  leagueId: number,
): Promise<OpenMatchdayEntry[]> {
  const now = new Date();
  const days = await db
    .select()
    .from(matchdays)
    .where(gt(matchdays.predictionDeadlineAt, now))
    .orderBy(asc(matchdays.predictionDeadlineAt));

  if (days.length === 0) return [];

  const annotated = await computeMatchdayStates(
    days.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage as Stage,
      predictionDeadlineAt: d.predictionDeadlineAt,
    })),
  );

  const openIds = annotated.filter((m) => m.state === "open").map((m) => m.id);
  if (openIds.length === 0) return [];

  // Dos queries agregadas (totals + filled) en paralelo. Antes era 2*N.
  const [totalsByDay, filledByDay] = await Promise.all([
    db
      .select({
        matchdayId: matches.matchdayId,
        total: sql<number>`count(*)::int`,
      })
      .from(matches)
      .where(inArray(matches.matchdayId, openIds))
      .groupBy(matches.matchdayId)
      .then((rows) => new Map(rows.map((r) => [r.matchdayId ?? 0, r.total]))),
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
          eq(predMatchResult.leagueId, leagueId),
          inArray(matches.matchdayId, openIds),
        ),
      )
      .groupBy(matches.matchdayId)
      .then((rows) => new Map(rows.map((r) => [r.matchdayId ?? 0, r.filled]))),
  ]);

  const out: OpenMatchdayEntry[] = [];
  for (const m of annotated) {
    if (m.state !== "open") continue;
    out.push({
      id: m.id,
      name: m.name,
      stage: m.stage,
      predictionDeadlineAt: new Date(m.predictionDeadlineAt),
      total: totalsByDay.get(m.id) ?? 0,
      filled: filledByDay.get(m.id) ?? 0,
    });
  }
  return out;
}

/**
 * Resumen rápido para el banner y el badge. Reusa loadOpenMatchdays (cacheada).
 *   - `imminent`: deadline pendiente más urgente que cierra en <24h
 *   - `pendingCount`: total de predicciones que faltan en jornadas abiertas
 */
export async function loadDeadlineSummary(
  userId: string,
  leagueId: number,
): Promise<{
  imminent: PendingDeadline | null;
  pendingCount: number;
}> {
  const open = await loadOpenMatchdays(userId, leagueId);
  if (open.length === 0) {
    return { imminent: null, pendingCount: 0 };
  }
  const now = Date.now();
  const soonCutoff = now + SOON_MS;
  let pendingCount = 0;
  const candidates: PendingDeadline[] = [];
  for (const m of open) {
    const missing = m.total - m.filled;
    if (missing <= 0) continue;
    pendingCount += missing;
    const closesMs = m.predictionDeadlineAt.getTime();
    if (closesMs <= soonCutoff) {
      candidates.push({
        kind: "matchday",
        href: `/predicciones/jornada/${m.id}`,
        label: m.name,
        closesAt: m.predictionDeadlineAt.toISOString(),
        msRemaining: closesMs - now,
        missing,
      });
    }
  }
  candidates.sort((a, b) => a.msRemaining - b.msRemaining);
  return { imminent: candidates[0] ?? null, pendingCount };
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
