import { unstable_cache } from "next/cache";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  leagueMemberships,
  pointsLedger,
  predBracketSlot,
  profiles,
  matches,
} from "@/lib/db/schema";
import { compareForRanking } from "@/lib/scoring/tiebreaker";

/**
 * TTL del leaderboard cacheado a nivel de liga. Suficientemente corto para
 * que los puntos se vean "en directo" durante una jornada de partidos, y
 * suficientemente largo para que 5 usuarios concurrentes de la misma liga
 * pegando al dashboard compartan una sola query agregada.
 *
 * Si el admin recomputa puntos, los cambios tardan como mucho este TTL en
 * verse. Para invalidar inmediato, llamar `revalidateTag("leaderboard")`
 * tras el recompute.
 */
const LEADERBOARD_CACHE_SECONDS = 30;

export type LeaderboardEntry = {
  userId: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  totalPoints: number;
  exactScoresCount: number;
  knockoutPoints: number;
  championCorrect: boolean;
};

/**
 * Leaderboard agregado en UNA sola query usando el query builder de Drizzle.
 * Reemplaza al patrón antiguo de traer todos los `profiles` + todo
 * `points_ledger` y procesarlo en JS, que escalaba mal en la liga pública.
 *
 * Si `withChampionCorrect=true` también determina quién acertó al campeón
 * (requiere que la final esté resuelta).
 *
 * Defensivo: si la query falla (statement timeout, etc.) devuelve [] en
 * lugar de propagar — el dashboard renderiza el podio vacío sin crashear.
 */
export async function loadLeaderboard(
  leagueId: number,
  options: { withChampionCorrect?: boolean } = {},
): Promise<LeaderboardEntry[]> {
  // Cacheamos por (leagueId, withChampionCorrect) durante 30s. Cinco
  // usuarios concurrentes de la misma liga → una sola query agregada en
  // vez de cinco. El champion-correct cambia solo cuando finaliza la
  // Final, así que lo metemos en la clave de caché para no servir un
  // resultado pre-resolución cuando alguien pide la versión "con campeón".
  const flag = options.withChampionCorrect ? "1" : "0";
  const cached = unstable_cache(
    () => loadLeaderboardRaw(leagueId, options),
    ["leaderboard", String(leagueId), flag],
    { revalidate: LEADERBOARD_CACHE_SECONDS, tags: ["leaderboard", `leaderboard:${leagueId}`] },
  );
  return cached();
}

async function loadLeaderboardRaw(
  leagueId: number,
  options: { withChampionCorrect?: boolean },
): Promise<LeaderboardEntry[]> {
  try {
    return await loadLeaderboardUnsafe(leagueId, options);
  } catch (err) {
    console.error("loadLeaderboard failed:", err);
    return [];
  }
}

async function loadLeaderboardUnsafe(
  leagueId: number,
  options: { withChampionCorrect?: boolean },
): Promise<LeaderboardEntry[]> {
  const rows = await db
    .select({
      userId: profiles.id,
      email: profiles.email,
      nickname: profiles.nickname,
      avatarUrl: profiles.avatarUrl,
      totalPoints: sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int`,
      exactScoresCount: sql<number>`count(*) filter (where ${pointsLedger.source} in ('match_exact_score','knockout_score_90'))::int`,
      knockoutPoints: sql<number>`coalesce(sum(${pointsLedger.points}) filter (where ${pointsLedger.source} in ('bracket_slot','knockout_qualifier','knockout_pens_bonus','knockout_score_90')), 0)::int`,
    })
    .from(leagueMemberships)
    .innerJoin(profiles, eq(profiles.id, leagueMemberships.userId))
    .leftJoin(
      pointsLedger,
      and(
        eq(pointsLedger.userId, profiles.id),
        eq(pointsLedger.leagueId, leagueMemberships.leagueId),
      ),
    )
    .where(eq(leagueMemberships.leagueId, leagueId))
    .groupBy(profiles.id, profiles.email, profiles.nickname, profiles.avatarUrl)
    .orderBy(
      desc(sql`coalesce(sum(${pointsLedger.points}), 0)`),
      desc(sql`count(*) filter (where ${pointsLedger.source} in ('match_exact_score','knockout_score_90'))`),
      desc(sql`coalesce(sum(${pointsLedger.points}) filter (where ${pointsLedger.source} in ('bracket_slot','knockout_qualifier','knockout_pens_bonus','knockout_score_90')), 0)`),
    );

  const championCorrectByUser = new Map<string, boolean>();
  if (options.withChampionCorrect) {
    const [officialWinner] = await db
      .select({ winnerTeamId: matches.winnerTeamId })
      .from(matches)
      .where(and(eq(matches.stage, "final"), sql`${matches.winnerTeamId} is not null`))
      .orderBy(desc(matches.scheduledAt))
      .limit(1);
    const winnerTeamId = officialWinner?.winnerTeamId ?? null;
    if (winnerTeamId != null && rows.length > 0) {
      const champPicks = await db
        .select({
          userId: predBracketSlot.userId,
          predictedTeamId: predBracketSlot.predictedTeamId,
        })
        .from(predBracketSlot)
        .where(
          and(
            eq(predBracketSlot.leagueId, leagueId),
            eq(predBracketSlot.stage, "final"),
            eq(predBracketSlot.slotPosition, 0),
            inArray(
              predBracketSlot.userId,
              rows.map((r) => r.userId),
            ),
          ),
        );
      for (const p of champPicks) {
        championCorrectByUser.set(p.userId, p.predictedTeamId === winnerTeamId);
      }
    }
  }

  const entries: LeaderboardEntry[] = rows.map((r) => ({
    userId: r.userId,
    email: r.email,
    nickname: r.nickname,
    avatarUrl: r.avatarUrl,
    totalPoints: r.totalPoints,
    exactScoresCount: r.exactScoresCount,
    knockoutPoints: r.knockoutPoints,
    championCorrect: championCorrectByUser.get(r.userId) ?? false,
  }));

  // SQL ya ordena por (total, exact, knockout). Si pedimos championCorrect,
  // reordenamos empates con el comparador canónico (incluye el bit de campeón).
  if (options.withChampionCorrect) {
    entries.sort((a, b) => compareForRanking(a, b));
  }
  return entries;
}

/**
 * Cuenta cuántos miembros tiene la liga sin traer las filas. Útil para el
 * empty-state de "X jugadores · sin puntos aún" pre-torneo.
 */
export async function countLeagueMembers(leagueId: number): Promise<number> {
  const [row] = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(leagueMemberships)
    .where(eq(leagueMemberships.leagueId, leagueId));
  return row?.c ?? 0;
}

/**
 * `true` si hay al menos una fila en points_ledger para la liga. Short-circuit
 * barato para saltar el cálculo del ranking pre-torneo cuando nadie tiene
 * puntos todavía.
 */
export async function leagueHasPoints(leagueId: number): Promise<boolean> {
  const rows = await db
    .select({ id: pointsLedger.id })
    .from(pointsLedger)
    .where(eq(pointsLedger.leagueId, leagueId))
    .limit(1);
  return rows.length > 0;
}
