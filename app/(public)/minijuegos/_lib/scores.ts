import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { minigameScores } from "@/lib/db/schema";
import type { MinigameScoreRow } from "../_shared/score-table";

/** Carga el ranking ordenado descendente por mejor puntuación, top N. */
export async function loadScoreboard(
  gameKey: string,
  limit = 100,
): Promise<MinigameScoreRow[]> {
  const rows = await db
    .select({
      identityKey: minigameScores.identityKey,
      displayName: minigameScores.displayName,
      bestScore: minigameScores.bestScore,
      userId: minigameScores.userId,
    })
    .from(minigameScores)
    .where(eq(minigameScores.gameKey, gameKey))
    .orderBy(desc(minigameScores.bestScore), minigameScores.playedAt)
    .limit(limit);

  return rows.map((r) => ({
    identityKey: r.identityKey,
    displayName: r.displayName,
    bestScore: r.bestScore,
    isGuest: r.userId == null,
  }));
}

/**
 * Devuelve la mejor puntuación de un usuario logueado en un juego dado, o
 * null si nunca ha jugado. Usado en el hub para mostrar "Mejor: X" en cada
 * card sin tener que cargar el ranking completo.
 */
export async function loadMyBestScore(
  gameKey: string,
  identityKey: string,
): Promise<number | null> {
  const [row] = await db
    .select({ best: minigameScores.bestScore })
    .from(minigameScores)
    .where(
      and(eq(minigameScores.gameKey, gameKey), eq(minigameScores.identityKey, identityKey)),
    )
    .limit(1);
  return row?.best ?? null;
}

/** Total de filas (participantes únicos) en un juego — para "X jugadores". */
export async function countParticipants(gameKey: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`COUNT(*)::int` })
    .from(minigameScores)
    .where(eq(minigameScores.gameKey, gameKey));
  return row?.n ?? 0;
}
