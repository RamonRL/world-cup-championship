import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groupStandings, matches } from "@/lib/db/schema";

/**
 * El bracket pasa por tres estados:
 *   - "waiting"  → la fase de grupos aún no se ha cerrado. No se pueden hacer
 *                  predicciones ni se conocen los 32 clasificados.
 *   - "open"     → fase de grupos cerrada (group_standings poblada) y el
 *                  primer partido de R32 todavía no ha empezado. Los usuarios
 *                  pueden editar libremente.
 *   - "closed"   → primer partido de R32 ya empezó. Bracket congelado y
 *                  visible públicamente para todos los participantes.
 */
export type BracketState = "waiting" | "open" | "closed";

export type BracketStatus = {
  state: BracketState;
  /** Cuándo arranca el primer partido de R32 (cierre del bracket). Null si no hay R32 cargado. */
  closesAt: Date | null;
};

export async function getBracketStatus(): Promise<BracketStatus> {
  const [anyStanding] = await db.select().from(groupStandings).limit(1);
  const groupStageClosed = !!anyStanding;

  const [firstR32] = await db
    .select({ scheduledAt: matches.scheduledAt })
    .from(matches)
    .where(eq(matches.stage, "r32"))
    .orderBy(asc(matches.scheduledAt))
    .limit(1);
  const closesAt = firstR32?.scheduledAt ?? null;
  const r32Started = closesAt ? new Date(closesAt).getTime() <= Date.now() : false;

  const state: BracketState = !groupStageClosed
    ? "waiting"
    : r32Started
      ? "closed"
      : "open";

  return { state, closesAt };
}

/**
 * Devuelve los IDs de los 32 clasificados a fase eliminatoria a partir del
 * group_standings finalizado: top 2 de cada uno de los 12 grupos (24 equipos)
 * + los 8 mejores terceros (criterio FIFA: puntos, diferencia de goles, goles
 * a favor).
 *
 * Si la fase de grupos no está cerrada, devuelve un array vacío.
 */
export async function getQualifiedTeamIds(): Promise<number[]> {
  const all = await db.select().from(groupStandings);
  if (all.length === 0) return [];

  const top2 = all.filter((s) => s.position === 1 || s.position === 2);
  const thirds = all
    .filter((s) => s.position === 3)
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const gdA = a.goalsFor - a.goalsAgainst;
      const gdB = b.goalsFor - b.goalsAgainst;
      if (gdB !== gdA) return gdB - gdA;
      return b.goalsFor - a.goalsFor;
    })
    .slice(0, 8);

  return [...top2.map((s) => s.teamId), ...thirds.map((s) => s.teamId)];
}
