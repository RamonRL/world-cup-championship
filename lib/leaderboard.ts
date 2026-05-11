import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { compareForRanking } from "@/lib/scoring/tiebreaker";

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

type LeaderboardRow = {
  user_id: string;
  email: string;
  nickname: string | null;
  avatar_url: string | null;
  total_points: number;
  exact_scores_count: number;
  knockout_points: number;
  champion_correct: boolean;
};

/**
 * Carga el leaderboard completo de una liga en UNA sola query agregada.
 * Reemplaza al patrón antiguo de traer `allUsers` + `allLedger` y procesarlos
 * en JS, que escalaba mal en la liga pública.
 *
 * Si `withChampionCorrect=true`, también determina quién acertó el campeón
 * (requiere haber resuelto la final). Default `false` — el dashboard no lo
 * necesita para el podio.
 */
export async function loadLeaderboard(
  leagueId: number,
  options: { withChampionCorrect?: boolean } = {},
): Promise<LeaderboardEntry[]> {
  const result = await db.execute<LeaderboardRow>(sql`
    WITH official_champion AS (
      SELECT winner_team_id
      FROM matches
      WHERE stage = 'final' AND winner_team_id IS NOT NULL
      ORDER BY scheduled_at DESC
      LIMIT 1
    )
    SELECT
      p.id            AS user_id,
      p.email         AS email,
      p.nickname      AS nickname,
      p.avatar_url    AS avatar_url,
      COALESCE(SUM(l.points), 0)::int AS total_points,
      COUNT(*) FILTER (
        WHERE l.source IN ('match_exact_score', 'knockout_score_90')
      )::int          AS exact_scores_count,
      COALESCE(
        SUM(l.points) FILTER (
          WHERE l.source IN (
            'bracket_slot', 'knockout_qualifier',
            'knockout_pens_bonus', 'knockout_score_90'
          )
        ),
        0
      )::int          AS knockout_points,
      ${
        options.withChampionCorrect
          ? sql`COALESCE((
              SELECT b.predicted_team_id = (SELECT winner_team_id FROM official_champion)
              FROM pred_bracket_slot b
              WHERE b.user_id = p.id
                AND b.league_id = ${leagueId}
                AND b.stage = 'final'
                AND b.slot_position = 0
              LIMIT 1
            ), false)`
          : sql`false`
      } AS champion_correct
    FROM league_memberships m
    INNER JOIN profiles p ON p.id = m.user_id
    LEFT JOIN points_ledger l
      ON l.user_id = p.id
      AND l.league_id = m.league_id
    WHERE m.league_id = ${leagueId}
    GROUP BY p.id, p.email, p.nickname, p.avatar_url
    ORDER BY total_points DESC, exact_scores_count DESC, knockout_points DESC;
  `);

  const rows = result as unknown as LeaderboardRow[];
  const entries: LeaderboardEntry[] = rows.map((r) => ({
    userId: r.user_id,
    email: r.email,
    nickname: r.nickname,
    avatarUrl: r.avatar_url,
    totalPoints: r.total_points,
    exactScoresCount: r.exact_scores_count,
    knockoutPoints: r.knockout_points,
    championCorrect: r.champion_correct,
  }));

  // SQL ya ordena por (total, exact, knockout). Si pidieron championCorrect,
  // reordenamos los empates exactos con el comparador canónico para incluir
  // el bit de campeón — solo afecta a empates, así que es casi free.
  if (options.withChampionCorrect) {
    entries.sort((a, b) => compareForRanking(a, b));
  }
  return entries;
}

/**
 * Cuenta cuántos miembros tiene la liga sin traer las filas. Útil para el
 * empty-state de "X jugadores · sin puntos aún" en pre-torneo.
 */
export async function countLeagueMembers(leagueId: number): Promise<number> {
  const result = await db.execute<{ c: number }>(sql`
    SELECT COUNT(*)::int AS c
    FROM league_memberships
    WHERE league_id = ${leagueId};
  `);
  const rows = result as unknown as { c: number }[];
  return rows[0]?.c ?? 0;
}

/**
 * Devuelve `true` si hay AL MENOS UNA fila en points_ledger para la liga.
 * Sirve como short-circuit barato: pre-torneo nadie tiene puntos y queremos
 * saltar el cálculo del ranking sin traer miles de filas.
 */
export async function leagueHasPoints(leagueId: number): Promise<boolean> {
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(
      SELECT 1 FROM points_ledger WHERE league_id = ${leagueId}
    ) AS exists;
  `);
  const rows = result as unknown as { exists: boolean }[];
  return rows[0]?.exists ?? false;
}
