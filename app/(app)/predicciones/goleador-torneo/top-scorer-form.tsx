"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Lock, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamFlag } from "@/components/brand/team-flag";
import { initials, cn } from "@/lib/utils";
import { saveTopScorerPrediction, type FormState } from "./actions";

const initial: FormState = { ok: false };

type PlayerOpt = {
  id: number;
  name: string;
  position: string | null;
  jerseyNumber: number | null;
  photoUrl: string | null;
  teamCode: string;
  teamName: string;
  groupCode: string | null;
};

type GroupOpt = { code: string; teams: { code: string; name: string }[] };

type Position = "DEL" | "MED" | "DEF" | "POR";
const POSITIONS: Position[] = ["DEL", "MED", "DEF", "POR"];
const POSITION_LABEL: Record<Position, string> = {
  DEL: "Delanteros",
  MED: "Mediocampistas",
  DEF: "Defensas",
  POR: "Porteros",
};
const POSITION_LABEL_SHORT: Record<Position, string> = {
  DEL: "Delantero",
  MED: "Mediocampo",
  DEF: "Defensa",
  POR: "Portero",
};
const POSITION_ACCENT: Record<
  Position,
  { ring: string; chip: string; dot: string; text: string }
> = {
  DEL: {
    ring: "ring-[var(--color-arena)]",
    chip: "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_10%,transparent)] text-[var(--color-arena)]",
    dot: "bg-[var(--color-arena)]",
    text: "text-[var(--color-arena)]",
  },
  MED: {
    ring: "ring-[var(--color-warning)]",
    chip:
      "border-[var(--color-warning)]/40 bg-[color-mix(in_oklch,var(--color-warning)_15%,transparent)] text-[var(--color-warning)]",
    dot: "bg-[var(--color-warning)]",
    text: "text-[var(--color-warning)]",
  },
  DEF: {
    ring: "ring-sky-400",
    chip: "border-sky-400/40 bg-sky-400/10 text-sky-400",
    dot: "bg-sky-400",
    text: "text-sky-400",
  },
  POR: {
    ring: "ring-emerald-400",
    chip: "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
    dot: "bg-emerald-400",
    text: "text-emerald-400",
  },
};

function normalizePosition(p: string | null): Position | null {
  if (!p) return null;
  const u = p.toUpperCase();
  if (u.startsWith("DEL") || u === "FW" || u.startsWith("FOR")) return "DEL";
  if (u.startsWith("MED") || u === "MF" || u.startsWith("MID")) return "MED";
  if (u.startsWith("DEF") || u === "DF") return "DEF";
  if (u.startsWith("POR") || u === "GK" || u.startsWith("GOAL")) return "POR";
  return null;
}

export function TopScorerForm({
  players,
  groups,
  existingPlayerId,
  open,
}: {
  players: PlayerOpt[];
  groups: GroupOpt[];
  existingPlayerId: number | null;
  open: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(existingPlayerId);
  const [teamFilter, setTeamFilter] = useState<string | null>(null);
  const [posFilter, setPosFilter] = useState<Position | null>(null);
  const [state, action, pending] = useActionState(saveTopScorerPrediction, initial);

  const filtered = useMemo(() => {
    return players.filter((p) => {
      if (teamFilter && p.teamCode !== teamFilter) return false;
      if (posFilter && normalizePosition(p.position) !== posFilter) return false;
      return true;
    });
  }, [teamFilter, posFilter, players]);

  // Agrupar por posición. Orden: DEL → MED → DEF → POR (los goleadores arriba).
  const byPosition = useMemo(() => {
    const map: Record<Position, PlayerOpt[]> = { DEL: [], MED: [], DEF: [], POR: [] };
    const unknown: PlayerOpt[] = [];
    for (const p of filtered) {
      const pos = normalizePosition(p.position);
      if (pos) map[pos].push(p);
      else unknown.push(p);
    }
    for (const k of POSITIONS) {
      map[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    return { map, unknown };
  }, [filtered]);

  const totalShown = filtered.length;
  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selected) ?? null,
    [players, selected],
  );

  const groupRows = useMemo(() => {
    // 2 filas de 6 grupos cada una = 24 banderas por fila.
    const sorted = [...groups].sort((a, b) => a.code.localeCompare(b.code));
    return [sorted.slice(0, 6), sorted.slice(6, 12)];
  }, [groups]);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="playerId" value={selected ?? ""} />
      {!open ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]">
          <Lock className="size-4" />
          La predicción está cerrada.
        </div>
      ) : null}

      {/* ─── Filtros: banderas + posiciones ─── */}
      <section className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5">
        <div className="space-y-3">
          {groupRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="flex flex-wrap items-stretch justify-center gap-x-2 gap-y-3 sm:gap-x-3"
            >
              {row.map((g, gIdx) => (
                <div key={g.code} className="flex items-stretch gap-x-2 sm:gap-x-3">
                  <GroupColumn
                    group={g}
                    activeTeam={teamFilter}
                    onPickTeam={(code) =>
                      setTeamFilter(teamFilter === code ? null : code)
                    }
                  />
                  {gIdx < row.length - 1 ? (
                    <span
                      aria-hidden
                      className="self-stretch w-px bg-[var(--color-border)]/60"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Pills de posición */}
        <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--color-border)] pt-4">
          <p className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Posición
          </p>
          {POSITIONS.map((p) => {
            const active = posFilter === p;
            const a = POSITION_ACCENT[p];
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPosFilter(active ? null : p)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] transition",
                  active
                    ? `${a.chip} ring-1 ${a.ring}`
                    : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] hover:border-[var(--color-arena)]/40 hover:text-[var(--color-foreground)]",
                )}
              >
                <span className={cn("size-1.5 rounded-full", a.dot)} />
                {POSITION_LABEL[p]}
              </button>
            );
          })}
          {teamFilter || posFilter ? (
            <button
              type="button"
              onClick={() => {
                setTeamFilter(null);
                setPosFilter(null);
              }}
              className="ml-auto font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] underline-offset-2 hover:underline"
            >
              Limpiar filtros
            </button>
          ) : null}
        </div>
      </section>

      {/* ─── Bolsa de candidatos ─── */}
      <section className="space-y-6">
        {totalShown === 0 ? (
          <p className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 p-8 text-center font-editorial italic text-[var(--color-muted-foreground)]">
            Sin candidatos para esos filtros.
          </p>
        ) : (
          (
            [
              ...POSITIONS.filter((p) => byPosition.map[p].length > 0),
            ] as const
          ).map((pos) => (
            <div key={pos} className="space-y-3">
              <header className="flex items-center gap-3">
                <span className={cn("h-2 w-2 rounded-full", POSITION_ACCENT[pos].dot)} />
                <p
                  className={cn(
                    "font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em]",
                    POSITION_ACCENT[pos].text,
                  )}
                >
                  {POSITION_LABEL[pos]}
                </p>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  {byPosition.map[pos].length}
                </span>
                <span className="ml-2 h-px flex-1 bg-[var(--color-border)]" />
              </header>
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                {byPosition.map[pos].map((p) => (
                  <PlayerCard
                    key={p.id}
                    player={p}
                    pos={pos}
                    active={selected === p.id}
                    onClick={() => open && setSelected(selected === p.id ? null : p.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
        {byPosition.unknown.length > 0 ? (
          <div className="space-y-3">
            <header className="flex items-center gap-3">
              <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Sin posición
              </p>
              <span className="ml-2 h-px flex-1 bg-[var(--color-border)]" />
            </header>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {byPosition.unknown.map((p) => (
                <PlayerCard
                  key={p.id}
                  player={p}
                  pos={null}
                  active={selected === p.id}
                  onClick={() => open && setSelected(selected === p.id ? null : p.id)}
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>

      {/* ─── Save bar ─── */}
      {state.error ? <p className="text-sm text-[var(--color-danger)]">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-[var(--color-success)]">Guardado.</p> : null}
      {open ? (
        <div className="sticky bottom-[calc(env(safe-area-inset-bottom)+5.5rem)] z-10 flex items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-surface)_92%,transparent)] p-3 backdrop-blur-md sm:bottom-3">
          <div className="min-w-0 truncate text-sm">
            {selectedPlayer ? (
              <span className="flex items-center gap-2">
                <TeamFlag code={selectedPlayer.teamCode} size={20} />
                <span className="font-display text-base tracking-tight">
                  {selectedPlayer.name}
                </span>
                {selectedPlayer.jerseyNumber != null ? (
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                    #{selectedPlayer.jerseyNumber}
                  </span>
                ) : null}
              </span>
            ) : (
              <span className="font-editorial italic text-[var(--color-muted-foreground)]">
                Aún sin candidato.
              </span>
            )}
          </div>
          <Button type="submit" size="lg" disabled={pending || selected == null}>
            <Save />
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function GroupColumn({
  group,
  activeTeam,
  onPickTeam,
}: {
  group: GroupOpt;
  activeTeam: string | null;
  onPickTeam: (code: string) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span className="font-display text-sm tracking-tight text-[var(--color-muted-foreground)]">
        {group.code}
      </span>
      <div className="flex items-center gap-1.5">
        {group.teams.map((t) => {
          const isActive = activeTeam === t.code;
          return (
            <button
              key={t.code}
              type="button"
              onClick={() => onPickTeam(t.code)}
              title={t.name}
              aria-label={t.name}
              className={cn(
                "block size-7 rounded-full transition",
                isActive
                  ? "ring-2 ring-[var(--color-arena)] ring-offset-2 ring-offset-[var(--color-surface)]"
                  : "opacity-90 hover:scale-110 hover:opacity-100",
              )}
            >
              <TeamFlag code={t.code} size={28} />
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PlayerCard({
  player,
  pos,
  active,
  onClick,
}: {
  player: PlayerOpt;
  pos: Position | null;
  active: boolean;
  onClick: () => void;
}) {
  const accent = pos ? POSITION_ACCENT[pos] : null;
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 overflow-hidden rounded-xl border p-3 text-left transition-all",
        active
          ? "border-[var(--color-arena)] bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))] shadow-[var(--shadow-arena)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-0.5 hover:border-[var(--color-arena)]/40 hover:shadow-[var(--shadow-elev-1)]",
      )}
    >
      {/* Acento de color de posición a la izquierda */}
      {accent ? (
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-0.5", accent.dot)}
        />
      ) : null}

      {/* Foto / iniciales */}
      <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {player.photoUrl ? (
          <Image
            src={player.photoUrl}
            alt={player.name}
            width={48}
            height={48}
            className="size-full object-cover"
          />
        ) : (
          <span className="font-display text-sm tracking-tight text-[var(--color-muted-foreground)]">
            {initials(player.name)}
          </span>
        )}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-display text-base tracking-tight">{player.name}</p>
        <div className="mt-0.5 flex items-center gap-2 text-[var(--color-muted-foreground)]">
          <TeamFlag code={player.teamCode} size={14} />
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em]">
            {player.teamCode}
          </span>
          {pos ? (
            <span
              className={cn(
                "rounded-full border px-1.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em]",
                POSITION_ACCENT[pos].chip,
              )}
            >
              {POSITION_LABEL_SHORT[pos]}
            </span>
          ) : null}
        </div>
      </div>

      {player.jerseyNumber != null ? (
        <span className="shrink-0 font-display tabular text-2xl tracking-tight text-[var(--color-muted-foreground)] group-hover:text-[var(--color-foreground)]">
          {player.jerseyNumber}
        </span>
      ) : null}
    </button>
  );
}
