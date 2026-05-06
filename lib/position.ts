/**
 * Posiciones canónicas de los jugadores (en castellano):
 *   POR · Portero
 *   DEF · Defensa
 *   MED · Mediocampo
 *   DEL · Delantero
 *
 * Es la única fuente de verdad para todo el front (selectors, filtros) y la
 * BD. Los valores legacy de Wikipedia (GK/DF/MF/FW/Goalkeeper/...) se
 * normalizan a esta forma en el momento de escritura.
 */
export const POSITIONS = ["POR", "DEF", "MED", "DEL"] as const;
export type Position = (typeof POSITIONS)[number];

export const POSITION_LABEL: Record<Position, string> = {
  POR: "Portero",
  DEF: "Defensa",
  MED: "Mediocampo",
  DEL: "Delantero",
};

/**
 * Acepta cualquier representación habitual y devuelve la forma canónica.
 * Devuelve null si no se reconoce o si el input es vacío.
 */
export function normalizePosition(raw: string | null | undefined): Position | null {
  if (!raw) return null;
  const u = raw.trim().toUpperCase();
  if (!u) return null;
  if (u === "POR" || u === "GK" || u.startsWith("GOAL") || u.startsWith("PORT")) return "POR";
  if (u === "DEF" || u === "DF" || u.startsWith("DEFEN")) return "DEF";
  if (u === "MED" || u === "MF" || u === "MID" || u.startsWith("MEDI") || u.startsWith("MIDF"))
    return "MED";
  if (u === "DEL" || u === "FW" || u === "FWD" || u.startsWith("DELAN") || u.startsWith("FORW"))
    return "DEL";
  return null;
}
