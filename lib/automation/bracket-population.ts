import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { groupStandings, groups, matches } from "@/lib/db/schema";
import { KO_FEEDS, R32_SLOTS } from "@/lib/bracket-format";

/**
 * Auto-rellenado del bracket post-partido.
 *
 * Reglas:
 *  - **R32 top-2**: tras finalizar el último (6º) partido del grupo X, los
 *    slots de R32 que pidan `groupWinner: X` o `groupRunnerUp: X` se
 *    rellenan automáticamente con el equipo de `group_standings` (pos 1 y 2).
 *  - **R32 mejores terceros**: SE QUEDAN MANUALES — los rellena el admin
 *    desde `/admin/operaciones/mejores-terceros`. Aquí no los tocamos.
 *  - **Cascade KO** (R32 → R16 → QF → SF → Final / Third): tras finalizar un
 *    KO match con winner, propagamos al partido alimentado por `KO_FEEDS`.
 *  - **Reverso**: al revertir un partido (vuelve a `scheduled`), limpiamos
 *    los downstream que dependieran de su ganador.
 *
 * Idempotente: si la BD ya tiene los valores correctos, no hace nada.
 */

/**
 * Tras cerrar un grupo (los 6 partidos finalizados), pone en R32 los top-2
 * en los slots correspondientes. Usa `R32_SLOTS` para saber qué partido pide
 * cada cosa. No toca slots de tipo `thirdPlace`.
 */
export async function populateR32FromGroup(groupId: number): Promise<void> {
  // Sólo si el grupo está completo (6 partidos finalizados). Defensivo.
  const groupMatchCount = await db
    .select({ count: matches.id })
    .from(matches)
    .where(and(eq(matches.groupId, groupId), eq(matches.stage, "group")));
  const finished = await db
    .select({ count: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.groupId, groupId),
        eq(matches.stage, "group"),
        eq(matches.status, "finished"),
      ),
    );
  if (finished.length !== groupMatchCount.length || finished.length === 0) return;

  const [group] = await db
    .select({ code: groups.code })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  if (!group) return;
  const groupCode = group.code;

  const standings = await db
    .select({ teamId: groupStandings.teamId, position: groupStandings.position })
    .from(groupStandings)
    .where(eq(groupStandings.groupId, groupId));
  const winnerId = standings.find((s) => s.position === 1)?.teamId;
  const runnerUpId = standings.find((s) => s.position === 2)?.teamId;
  if (winnerId == null || runnerUpId == null) return;

  // Recorre los R32 slots y, donde matchee, escribe el team. Solo cuando el
  // valor actual difiera (idempotente).
  for (const [code, slot] of Object.entries(R32_SLOTS)) {
    const updates: Partial<typeof matches.$inferInsert> = {};
    if (slot.home.kind === "groupWinner" && slot.home.group === groupCode) {
      updates.homeTeamId = winnerId;
    } else if (slot.home.kind === "groupRunnerUp" && slot.home.group === groupCode) {
      updates.homeTeamId = runnerUpId;
    }
    if (slot.away.kind === "groupWinner" && slot.away.group === groupCode) {
      updates.awayTeamId = winnerId;
    } else if (slot.away.kind === "groupRunnerUp" && slot.away.group === groupCode) {
      updates.awayTeamId = runnerUpId;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(matches).set(updates).where(eq(matches.code, code));
    }
  }
}

/**
 * Propaga el ganador (y, para el 3.º puesto, el perdedor) de un KO match a
 * los partidos alimentados según `KO_FEEDS`.
 */
export async function cascadeKoWinner(matchId: number): Promise<void> {
  const [m] = await db
    .select({
      code: matches.code,
      stage: matches.stage,
      status: matches.status,
      winnerTeamId: matches.winnerTeamId,
      homeTeamId: matches.homeTeamId,
      awayTeamId: matches.awayTeamId,
    })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!m) return;
  if (m.status !== "finished" || m.winnerTeamId == null) return;
  if (m.stage === "group" || m.stage === "third" || m.stage === "final") return;

  const loserId =
    m.homeTeamId != null && m.winnerTeamId === m.homeTeamId
      ? m.awayTeamId
      : m.homeTeamId;

  // Buscar todos los partidos KO_FEEDS que tengan a `m.code` como source.
  for (const [feedCode, feed] of Object.entries(KO_FEEDS)) {
    const updates: Partial<typeof matches.$inferInsert> = {};
    if (feed.home.code === m.code) {
      updates.homeTeamId = feed.home.loser ? loserId : m.winnerTeamId;
    }
    if (feed.away.code === m.code) {
      updates.awayTeamId = feed.away.loser ? loserId : m.winnerTeamId;
    }
    if (Object.keys(updates).length > 0) {
      await db.update(matches).set(updates).where(eq(matches.code, feedCode));
    }
  }
}

/**
 * Al revertir un KO match (vuelve a `scheduled` o pierde el winner), limpia
 * los downstream que dependieran de él. Recursivo: si limpia el home/away
 * del feed, también propaga el clear hacia sus propios feeds.
 */
export async function clearKoCascade(matchId: number): Promise<void> {
  const [m] = await db
    .select({ code: matches.code, stage: matches.stage })
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);
  if (!m) return;
  if (m.stage === "group") return;

  const stack: string[] = [m.code];
  const visited = new Set<string>();

  while (stack.length > 0) {
    const code = stack.pop()!;
    if (visited.has(code)) continue;
    visited.add(code);

    for (const [feedCode, feed] of Object.entries(KO_FEEDS)) {
      const updates: Partial<typeof matches.$inferInsert> = {};
      if (feed.home.code === code) updates.homeTeamId = null;
      if (feed.away.code === code) updates.awayTeamId = null;
      if (Object.keys(updates).length > 0) {
        // Limpio + también revierto status/winner si lo tenía marcado, para
        // que la cascada hacia los siguientes feeds sea coherente.
        await db
          .update(matches)
          .set({ ...updates, winnerTeamId: null })
          .where(eq(matches.code, feedCode));
        stack.push(feedCode);
      }
    }
  }
}

/**
 * Util: ¿están todos los R32 con home/away rellenos? Lo usa el gating del
 * bracket-state y de la matchday-state.
 */
export async function areAllR32MatchupsResolved(): Promise<boolean> {
  const r32 = await db
    .select({ homeTeamId: matches.homeTeamId, awayTeamId: matches.awayTeamId })
    .from(matches)
    .where(eq(matches.stage, "r32"));
  if (r32.length === 0) return false;
  return r32.every((m) => m.homeTeamId != null && m.awayTeamId != null);
}

/**
 * Util: lookup rápido del code de un grupo por id.
 */
export async function getGroupCode(groupId: number): Promise<string | null> {
  const [g] = await db
    .select({ code: groups.code })
    .from(groups)
    .where(eq(groups.id, groupId))
    .limit(1);
  return g?.code ?? null;
}

/**
 * ¿Está completo el grupo `groupId` (6 partidos finished)?
 */
export async function isGroupComplete(groupId: number): Promise<boolean> {
  const total = await db
    .select({ id: matches.id })
    .from(matches)
    .where(and(eq(matches.groupId, groupId), eq(matches.stage, "group")));
  if (total.length === 0) return false;
  const finished = await db
    .select({ id: matches.id })
    .from(matches)
    .where(
      and(
        eq(matches.groupId, groupId),
        eq(matches.stage, "group"),
        eq(matches.status, "finished"),
      ),
    );
  return finished.length === total.length;
}

/**
 * ¿Está toda la fase de grupos completa (todos los grupos con 6 partidos
 * finished)? Lo usamos para resolver especiales que esperan al final de
 * grupos.
 */
export async function isGroupStageComplete(): Promise<boolean> {
  const allGroup = await db
    .select({ id: matches.id, status: matches.status })
    .from(matches)
    .where(eq(matches.stage, "group"));
  if (allGroup.length === 0) return false;
  return allGroup.every((m) => m.status === "finished");
}

