import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groupStandings, matches } from "@/lib/db/schema";

/**
 * El bracket pasa por tres estados:
 *   - "waiting"  → todavía no están resueltos los 32 emparejamientos de R32:
 *                  o la fase de grupos no ha cerrado, o el admin aún no ha
 *                  ubicado a las 8 mejores terceras.
 *   - "open"     → todos los R32 tienen `homeTeamId` y `awayTeamId` set, y
 *                  el primer partido de R32 todavía no ha empezado.
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
  // El bracket abre cuando los 16 R32 tienen home Y away set. Los top-2 los
  // rellena el orquestador al cerrar cada grupo; las mejores terceras las
  // ubica el admin desde /admin/operaciones/mejores-terceros.
  const r32Rows = await db
    .select({
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
    })
    .from(matches)
    .where(eq(matches.stage, "r32"));
  const allMatchupsResolved =
    r32Rows.length > 0 &&
    r32Rows.every((m) => m.homeTeamId != null && m.awayTeamId != null);

  const [firstR32] = await db
    .select({ scheduledAt: matches.scheduledAt })
    .from(matches)
    .where(eq(matches.stage, "r32"))
    .orderBy(asc(matches.scheduledAt))
    .limit(1);
  const closesAt = firstR32?.scheduledAt ?? null;
  const r32Started = closesAt ? new Date(closesAt).getTime() <= Date.now() : false;

  const state: BracketState = !allMatchupsResolved
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
