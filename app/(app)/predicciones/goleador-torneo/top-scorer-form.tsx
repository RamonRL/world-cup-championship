"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Lock, Save, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { initials } from "@/lib/utils";
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
};

export function TopScorerForm({
  players,
  existingPlayerId,
  open,
}: {
  players: PlayerOpt[];
  existingPlayerId: number | null;
  open: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(existingPlayerId);
  const [filter, setFilter] = useState("");
  const [state, action, pending] = useActionState(saveTopScorerPrediction, initial);

  const filtered = useMemo(() => {
    if (!filter) return players;
    const f = filter.toLowerCase();
    return players.filter(
      (p) =>
        p.name.toLowerCase().includes(f) ||
        p.teamName.toLowerCase().includes(f) ||
        p.teamCode.toLowerCase().includes(f),
    );
  }, [filter, players]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="playerId" value={selected ?? ""} />
      {!open ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]">
          <Lock className="size-4" />
          La predicción está cerrada.
        </div>
      ) : null}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="text-base">Tu candidato</CardTitle>
          <div className="relative w-64 max-w-full">
            <Search className="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
            <Input
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Buscar jugador o selección…"
              className="h-9 pl-8 text-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const active = selected === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => open && setSelected(p.id)}
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
                    <p className="truncate text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      <Badge variant="outline" className="mr-1 text-[0.6rem]">
                        {p.teamCode}
                      </Badge>
                      {p.position ?? "—"}
                    </p>
                  </div>
                </button>
              );
            })}
            {filtered.length === 0 ? (
              <p className="col-span-full py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                Sin coincidencias.
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {state.error ? <p className="text-sm text-[var(--color-danger)]">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-[var(--color-success)]">Guardado.</p> : null}
      {open ? (
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending || selected == null}>
            <Save />
            {pending ? "Guardando…" : "Guardar candidato"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
