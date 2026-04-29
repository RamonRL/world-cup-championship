"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Lock, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { initials } from "@/lib/utils";
import { saveMatchScorerPrediction, type FormState } from "./actions";

const initial: FormState = { ok: false };

type TeamLite = { id: number; name: string; code: string };
type PlayerLite = {
  id: number;
  teamId: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  photoUrl: string | null;
};

export function MatchScorerForm({
  matchId,
  open,
  homeTeam,
  awayTeam,
  players,
  existingPlayerId,
}: {
  matchId: number;
  open: boolean;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
  players: PlayerLite[];
  existingPlayerId: number | null;
}) {
  const [selected, setSelected] = useState<number | null>(existingPlayerId);
  const [filter, setFilter] = useState("");
  const [state, action, pending] = useActionState(saveMatchScorerPrediction, initial);

  const playersByTeam = useMemo(() => {
    const map = new Map<number, PlayerLite[]>();
    for (const p of players) {
      const arr = map.get(p.teamId) ?? [];
      arr.push(p);
      map.set(p.teamId, arr);
    }
    return map;
  }, [players]);

  const filtered = (teamId: number | undefined) => {
    if (!teamId) return [];
    const arr = playersByTeam.get(teamId) ?? [];
    if (!filter) return arr;
    const f = filter.toLowerCase();
    return arr.filter(
      (p) =>
        p.name.toLowerCase().includes(f) ||
        (p.position ?? "").toLowerCase().includes(f) ||
        (p.jerseyNumber != null && String(p.jerseyNumber).includes(f)),
    );
  };

  const defaultTab = homeTeam ? `team-${homeTeam.id}` : `team-${awayTeam?.id}`;

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="matchId" value={matchId} />
      <input type="hidden" name="playerId" value={selected ?? ""} />

      {!open ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]">
          <Lock className="size-4" />
          La predicción está cerrada. Sólo puedes consultar tu elección.
        </div>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Tu candidato a marcar</CardTitle>
          <div className="relative w-56 max-w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar jugador…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={defaultTab}>
            <TabsList>
              {homeTeam ? (
                <TabsTrigger value={`team-${homeTeam.id}`}>
                  {homeTeam.code}
                </TabsTrigger>
              ) : null}
              {awayTeam ? (
                <TabsTrigger value={`team-${awayTeam.id}`}>
                  {awayTeam.code}
                </TabsTrigger>
              ) : null}
            </TabsList>
            {homeTeam ? (
              <TabsContent value={`team-${homeTeam.id}`}>
                <PlayerGrid
                  players={filtered(homeTeam.id)}
                  selected={selected}
                  setSelected={open ? setSelected : () => {}}
                />
              </TabsContent>
            ) : null}
            {awayTeam ? (
              <TabsContent value={`team-${awayTeam.id}`}>
                <PlayerGrid
                  players={filtered(awayTeam.id)}
                  selected={selected}
                  setSelected={open ? setSelected : () => {}}
                />
              </TabsContent>
            ) : null}
          </Tabs>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-[var(--color-danger)]">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-success)]">Predicción guardada.</p>
      ) : null}
      {open ? (
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending || selected == null}>
            <Save />
            {pending ? "Guardando…" : "Guardar predicción"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function PlayerGrid({
  players,
  selected,
  setSelected,
}: {
  players: PlayerLite[];
  selected: number | null;
  setSelected: (id: number) => void;
}) {
  if (players.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-[var(--color-muted-foreground)]">
        No hay jugadores cargados para esta selección.
      </p>
    );
  }
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {players.map((p) => {
        const active = selected === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => setSelected(p.id)}
            className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${
              active
                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50"
            }`}
          >
            <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)]">
              {p.photoUrl ? (
                <Image src={p.photoUrl} alt={p.name} width={40} height={40} />
              ) : (
                <span className="text-xs font-semibold text-[var(--color-muted-foreground)]">
                  {initials(p.name)}
                </span>
              )}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                {p.jerseyNumber != null ? (
                  <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    #{p.jerseyNumber}
                  </span>
                ) : null}
                <span className="truncate text-sm font-medium">{p.name}</span>
              </div>
              {p.position ? (
                <Badge variant="outline" className="mt-1 text-[0.6rem]">
                  {p.position}
                </Badge>
              ) : null}
            </div>
          </button>
        );
      })}
    </div>
  );
}
