"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { GROUP_CODES, type GroupCode } from "@/lib/bracket-format";

type Position = 1 | 2 | 3;

/**
 * Selector interactivo para resaltar los slots del bracket de pre-fase de
 * grupos. El usuario elige grupo + posición y mostramos en color qué partidos
 * de R32 corresponderían a ese clasificado.
 *
 * Trabajamos sobre los `data-slot-home` / `data-slot-away` que el árbol pinta
 * en cada tarjeta R32. Para 3º, marcamos todos los partidos en cuyo "pool"
 * aparezca el grupo (cualquiera podría tocarles).
 */
export function BracketSlotHighlighter() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [group, setGroup] = useState<GroupCode | "">("");
  const [position, setPosition] = useState<Position | null>(null);

  useEffect(() => {
    const root = containerRef.current?.parentElement;
    if (!root) return;
    const cards = Array.from(
      root.querySelectorAll<HTMLElement>("[data-bracket-card]"),
    );
    cards.forEach((c) => {
      c.classList.remove("bracket-slot-highlight", "bracket-slot-dim");
    });
    if (!group || !position) return;

    const matched = new Set<HTMLElement>();
    for (const card of cards) {
      const home = card.getAttribute("data-slot-home");
      const away = card.getAttribute("data-slot-away");
      if (slotMatches(home, group, position) || slotMatches(away, group, position)) {
        matched.add(card);
      }
    }
    if (matched.size === 0) return;
    cards.forEach((c) => {
      if (matched.has(c)) c.classList.add("bracket-slot-highlight");
      else c.classList.add("bracket-slot-dim");
    });
  }, [group, position]);

  const reset = () => {
    setGroup("");
    setPosition(null);
  };

  const active = !!group && position != null;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_5%,var(--color-surface))] p-4"
    >
      <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
        <Sparkles className="size-3.5" />
        Simulador
      </div>
      <div className="flex items-center gap-2">
        <label className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
          Grupo
        </label>
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value as GroupCode | "")}
          className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 font-display text-sm tabular text-[var(--color-foreground)]"
        >
          <option value="">—</option>
          {GROUP_CODES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        {([1, 2, 3] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPosition(position === p ? null : p)}
            disabled={!group}
            className={`rounded-md border px-3 py-1.5 font-display text-sm tabular transition disabled:cursor-not-allowed disabled:opacity-50 ${
              position === p
                ? "border-[var(--color-arena)] bg-[var(--color-arena)] text-white"
                : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)] hover:border-[var(--color-arena)]/50"
            }`}
            aria-pressed={position === p}
          >
            {p}º
          </button>
        ))}
      </div>
      {active ? (
        <button
          type="button"
          onClick={reset}
          className="ml-auto inline-flex items-center gap-1 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] transition hover:border-[var(--color-arena)]/40 hover:text-[var(--color-foreground)]"
        >
          <X className="size-3" /> Quitar
        </button>
      ) : (
        <p className="ml-auto font-editorial text-xs italic text-[var(--color-muted-foreground)]">
          Elige grupo y posición para ver dónde caería el clasificado.
        </p>
      )}
    </div>
  );
}

function slotMatches(
  encoded: string | null,
  group: GroupCode,
  position: Position,
): boolean {
  if (!encoded) return false;
  if (position === 1) return encoded === `1${group}`;
  if (position === 2) return encoded === `2${group}`;
  // 3º: "3:G1,G2,..."
  if (!encoded.startsWith("3:")) return false;
  return encoded.slice(2).split(",").includes(group);
}
