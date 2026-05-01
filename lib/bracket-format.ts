/**
 * FIFA 2026 — bracket de eliminación directa.
 *
 * El emparejamiento de R32 (M73-M88) está fijado por reglamento ANTES del
 * sorteo, en función de la posición que cada selección termine en su grupo.
 * Los 8 mejores terceros se asignan a un slot concreto según el "pool" de
 * grupos del que provengan (Anexo C del reglamento — tabla de 495 escenarios).
 *
 * Lo encodificamos aquí para poder mostrar el árbol de pre-fase de grupos:
 * la gente puede ver dónde acabaría su selección si queda 1º, 2º o se cuela
 * como mejor 3º.
 *
 * Fuente: 2026 FIFA World Cup knockout stage (Wikipedia).
 */

export type GroupCode =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L";

export const GROUP_CODES: GroupCode[] = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
];

export type SlotSource =
  | { kind: "groupWinner"; group: GroupCode }
  | { kind: "groupRunnerUp"; group: GroupCode }
  | { kind: "thirdPlace"; pool: GroupCode[] };

const gw = (g: GroupCode): SlotSource => ({ kind: "groupWinner", group: g });
const gr = (g: GroupCode): SlotSource => ({ kind: "groupRunnerUp", group: g });
const t3 = (...g: GroupCode[]): SlotSource => ({ kind: "thirdPlace", pool: g });

export const R32_SLOTS: Record<string, { home: SlotSource; away: SlotSource }> = {
  M73: { home: gr("A"), away: gr("B") },
  M74: { home: gw("E"), away: t3("A", "B", "C", "D", "F") },
  M75: { home: gw("F"), away: gr("C") },
  M76: { home: gw("C"), away: gr("F") },
  M77: { home: gw("I"), away: t3("C", "D", "F", "G", "H") },
  M78: { home: gr("E"), away: gr("I") },
  M79: { home: gw("A"), away: t3("C", "E", "F", "H", "I") },
  M80: { home: gw("L"), away: t3("E", "H", "I", "J", "K") },
  M81: { home: gw("D"), away: t3("B", "E", "F", "I", "J") },
  M82: { home: gw("G"), away: t3("A", "E", "H", "I", "J") },
  M83: { home: gr("K"), away: gr("L") },
  M84: { home: gw("H"), away: gr("J") },
  M85: { home: gw("B"), away: t3("E", "F", "G", "I", "J") },
  M86: { home: gw("J"), away: gr("H") },
  M87: { home: gw("K"), away: t3("D", "E", "I", "J", "L") },
  M88: { home: gr("D"), away: gr("G") },
};

/**
 * R16-Final: cada partido lo alimenta el ganador de dos partidos previos.
 * Para el 3er puesto, los perdedores de las semifinales.
 */
export const KO_FEEDS: Record<
  string,
  { home: { code: string; loser?: boolean }; away: { code: string; loser?: boolean } }
> = {
  M89: { home: { code: "M74" }, away: { code: "M77" } },
  M90: { home: { code: "M73" }, away: { code: "M75" } },
  M91: { home: { code: "M76" }, away: { code: "M78" } },
  M92: { home: { code: "M79" }, away: { code: "M80" } },
  M93: { home: { code: "M83" }, away: { code: "M84" } },
  M94: { home: { code: "M81" }, away: { code: "M82" } },
  M95: { home: { code: "M86" }, away: { code: "M88" } },
  M96: { home: { code: "M85" }, away: { code: "M87" } },
  M97: { home: { code: "M89" }, away: { code: "M90" } },
  M98: { home: { code: "M93" }, away: { code: "M94" } },
  M99: { home: { code: "M91" }, away: { code: "M92" } },
  M100: { home: { code: "M95" }, away: { code: "M96" } },
  M101: { home: { code: "M97" }, away: { code: "M98" } },
  M102: { home: { code: "M99" }, away: { code: "M100" } },
  M103: { home: { code: "M101", loser: true }, away: { code: "M102", loser: true } },
  M104: { home: { code: "M101" }, away: { code: "M102" } },
};

export function formatSlotSource(s: SlotSource): string {
  switch (s.kind) {
    case "groupWinner":
      return `1º ${s.group}`;
    case "groupRunnerUp":
      return `2º ${s.group}`;
    case "thirdPlace":
      return `3º ${s.pool.join("·")}`;
  }
}

/**
 * Codificación serializable para usar en `data-*` attributes:
 *   - "1A" / "2B"
 *   - "3:A,B,C,D,F" (3º en pool de grupos)
 */
export function encodeSlotSource(s: SlotSource): string {
  switch (s.kind) {
    case "groupWinner":
      return `1${s.group}`;
    case "groupRunnerUp":
      return `2${s.group}`;
    case "thirdPlace":
      return `3:${s.pool.join(",")}`;
  }
}

/**
 * Devuelve los códigos de R32 en los que terminaría el equipo que quede en
 * `position` del grupo `group`. Para 3º, devuelve TODOS los slots cuyo pool
 * incluya el grupo (cualquiera de ellos podría tocarle).
 */
export function r32MatchesForGroupPosition(
  group: GroupCode,
  position: 1 | 2 | 3,
): string[] {
  const out: string[] = [];
  for (const [code, slots] of Object.entries(R32_SLOTS)) {
    for (const slot of [slots.home, slots.away]) {
      const matches =
        (position === 1 && slot.kind === "groupWinner" && slot.group === group) ||
        (position === 2 && slot.kind === "groupRunnerUp" && slot.group === group) ||
        (position === 3 && slot.kind === "thirdPlace" && slot.pool.includes(group));
      if (matches) {
        out.push(code);
        break;
      }
    }
  }
  return out;
}
