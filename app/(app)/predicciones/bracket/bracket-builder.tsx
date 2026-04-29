"use client";

import Image from "next/image";
import { useActionState, useMemo, useState } from "react";
import { Lock, Save, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { saveBracketPicks, type FormState } from "./actions";

const initial: FormState = { ok: false };

type TeamLite = { id: number; code: string; name: string; flagUrl: string | null };

type Picks = {
  r16: number[];
  qf: number[];
  sf: number[];
  finalists: number[];
  championTeamId: number | null;
};

const STAGE_LIMITS = { r16: 16, qf: 8, sf: 4, final: 2 } as const;

const STAGE_LABEL = {
  r16: "Octavos (16 equipos)",
  qf: "Cuartos (8)",
  sf: "Semifinales (4)",
  final: "Final (2 finalistas)",
} as const;

export function BracketBuilder({
  teams,
  initial: initialPicks,
  open,
}: {
  teams: TeamLite[];
  initial: Picks;
  open: boolean;
}) {
  const [picks, setPicks] = useState<Picks>(initialPicks);
  const [state, action, pending] = useActionState(saveBracketPicks, initial);

  const teamById = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  function toggle(stage: keyof Omit<Picks, "championTeamId">, teamId: number, max: number) {
    if (!open) return;
    setPicks((prev) => {
      const cur = prev[stage];
      const removing = cur.includes(teamId);
      const nextStage = removing
        ? cur.filter((x) => x !== teamId)
        : cur.length >= max
          ? cur
          : [...cur, teamId];
      const next: Picks = { ...prev, [stage]: nextStage };
      if (!removing) return next;
      // Cascade: if a team is removed from a round, also remove it from later
      // rounds (and clear champion if it lost finalist status).
      if (stage === "r16") next.qf = next.qf.filter((x) => x !== teamId);
      if (stage === "r16" || stage === "qf")
        next.sf = next.sf.filter((x) => x !== teamId);
      if (stage === "r16" || stage === "qf" || stage === "sf")
        next.finalists = next.finalists.filter((x) => x !== teamId);
      if (next.championTeamId != null && !next.finalists.includes(next.championTeamId)) {
        next.championTeamId = null;
      }
      return next;
    });
  }

  function setChampion(teamId: number | null) {
    if (!open) return;
    setPicks((prev) => ({ ...prev, championTeamId: teamId }));
  }

  return (
    <form action={action} className="space-y-4">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({ picks })}
      />
      {!open ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]">
          <Lock className="size-4" />
          El bracket está cerrado. Sólo lectura.
        </div>
      ) : null}

      <Tabs defaultValue="r16">
        <TabsList>
          <TabsTrigger value="r16">R16</TabsTrigger>
          <TabsTrigger value="qf">QF</TabsTrigger>
          <TabsTrigger value="sf">SF</TabsTrigger>
          <TabsTrigger value="final">Final</TabsTrigger>
          <TabsTrigger value="champion">
            <Trophy className="size-3.5" />
            Campeón
          </TabsTrigger>
        </TabsList>

        {(["r16", "qf", "sf", "final"] as const).map((stage) => {
          const max = STAGE_LIMITS[stage];
          const stageKey = stage === "final" ? "finalists" : stage;
          const selected = picks[stageKey as keyof Omit<Picks, "championTeamId">];
          // Strict pool: each round must come from the previous one's picks.
          // R16 picks come from the 32 qualified teams the page passes in.
          const pool: TeamLite[] = (() => {
            if (stage === "r16") return teams;
            const sourceIds =
              stage === "qf" ? picks.r16 : stage === "sf" ? picks.qf : picks.sf;
            return sourceIds.map((id) => teamById.get(id)).filter(Boolean) as TeamLite[];
          })();
          const previousLabel =
            stage === "qf"
              ? "Octavos"
              : stage === "sf"
                ? "Cuartos"
                : stage === "final"
                  ? "Semifinales"
                  : null;

          return (
            <TabsContent key={stage} value={stage}>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between gap-2">
                  <div>
                    <CardTitle className="text-base">{STAGE_LABEL[stage]}</CardTitle>
                    <CardDescription>
                      Pulsa para seleccionar / deseleccionar. Máximo {max}.
                    </CardDescription>
                  </div>
                  <Badge variant={selected.length === max ? "success" : "outline"}>
                    {selected.length} / {max}
                  </Badge>
                </CardHeader>
                <CardContent>
                  {pool.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                      Antes rellena la pestaña de {previousLabel ?? "la ronda previa"}.
                    </p>
                  ) : (
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                      {pool.map((t) => {
                        const active = selected.includes(t.id);
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() =>
                              toggle(stageKey as keyof Omit<Picks, "championTeamId">, t.id, max)
                            }
                            className={`flex items-center gap-3 rounded-md border p-2.5 text-left transition ${
                              active
                                ? "border-[var(--color-primary)] bg-[var(--color-primary)]/10"
                                : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50"
                            }`}
                          >
                            <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                              {t.flagUrl ? (
                                <Image src={t.flagUrl} alt={t.code} width={28} height={28} />
                              ) : null}
                            </span>
                            <span className="text-sm font-medium">{t.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        <TabsContent value="champion">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="size-4" /> Campeón
              </CardTitle>
              <CardDescription>20 puntos. Premio gordo de la quiniela.</CardDescription>
            </CardHeader>
            <CardContent>
              {picks.finalists.length === 0 ? (
                <p className="py-6 text-center text-sm text-[var(--color-muted-foreground)]">
                  Antes rellena la pestaña de Final con tus dos finalistas.
                </p>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {(picks.finalists
                    .map((id) => teamById.get(id))
                    .filter(Boolean) as TeamLite[]).map((t) => {
                    const active = picks.championTeamId === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setChampion(active ? null : t.id)}
                        className={`flex items-center gap-3 rounded-md border p-3 text-left transition ${
                          active
                            ? "border-[var(--color-primary)] bg-[var(--color-primary)]/15 ring-2 ring-[var(--color-primary)]/30"
                            : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-primary)]/50"
                        }`}
                      >
                        <span className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                          {t.flagUrl ? (
                            <Image src={t.flagUrl} alt={t.code} width={36} height={36} />
                          ) : null}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{t.name}</p>
                          <p className="text-[0.65rem] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                            {t.code}
                          </p>
                        </div>
                        {active ? (
                          <Trophy className="size-5 text-[var(--color-primary)]" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {state.error ? <p className="text-sm text-[var(--color-danger)]">{state.error}</p> : null}
      {state.ok ? <p className="text-sm text-[var(--color-success)]">Bracket guardado.</p> : null}

      {open ? (
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            <Save />
            {pending ? "Guardando…" : "Guardar bracket"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
