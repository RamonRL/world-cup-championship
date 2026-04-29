"use client";

import Image from "next/image";
import { useActionState, useState } from "react";
import { Lock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { saveMatchdayPredictions, type FormState } from "./actions";

const initial: FormState = { ok: false };

type TeamLite = { id: number; name: string; code: string; flagUrl: string | null };

type MatchInput = {
  id: number;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  scheduledAt: string;
  venue: string | null;
  home: TeamLite | null;
  away: TeamLite | null;
  existing: {
    homeScore: number;
    awayScore: number;
    willGoToPens: boolean;
    winnerTeamId: number | null;
  } | null;
};

type Prediction = {
  matchId: number;
  homeScore: number;
  awayScore: number;
  willGoToPens: boolean;
  winnerTeamId: number | null;
};

export function MatchdayPredictionForm({
  matchdayId,
  matches,
  open,
}: {
  matchdayId: number;
  matches: MatchInput[];
  open: boolean;
}) {
  const [predictions, setPredictions] = useState<Prediction[]>(
    matches.map((m) => ({
      matchId: m.id,
      homeScore: m.existing?.homeScore ?? 0,
      awayScore: m.existing?.awayScore ?? 0,
      willGoToPens: m.existing?.willGoToPens ?? false,
      winnerTeamId: m.existing?.winnerTeamId ?? null,
    })),
  );
  const [state, action, pending] = useActionState(saveMatchdayPredictions, initial);

  function update(matchId: number, patch: Partial<Prediction>) {
    setPredictions((prev) =>
      prev.map((p) => (p.matchId === matchId ? { ...p, ...patch } : p)),
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input
        type="hidden"
        name="payload"
        value={JSON.stringify({ matchdayId, predictions })}
      />
      {!open ? (
        <div className="flex items-center gap-2 rounded-lg border border-[var(--color-warning)]/40 bg-[var(--color-warning)]/10 p-3 text-sm text-[var(--color-warning)]">
          <Lock className="size-4" />
          La predicción está cerrada. Sólo puedes consultar lo que enviaste.
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {matches.map((m) => {
          const p = predictions.find((x) => x.matchId === m.id)!;
          const isKnockout = m.stage !== "group";
          return (
            <Card key={m.id}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 p-4">
                <Badge variant="outline" className="text-[0.65rem] uppercase">
                  {m.stage}
                </Badge>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {new Date(m.scheduledAt).toLocaleString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </CardHeader>
              <CardContent className="space-y-3 p-4 pt-0">
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <TeamSide team={m.home} />
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={p.homeScore}
                    onChange={(e) =>
                      update(m.id, { homeScore: Number(e.target.value) })
                    }
                    disabled={!open}
                    className="h-12 w-14 text-center font-display text-xl"
                  />
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                  <TeamSide team={m.away} />
                  <Input
                    type="number"
                    min={0}
                    max={40}
                    value={p.awayScore}
                    onChange={(e) =>
                      update(m.id, { awayScore: Number(e.target.value) })
                    }
                    disabled={!open}
                    className="h-12 w-14 text-center font-display text-xl"
                  />
                </div>
                {isKnockout ? (
                  <div className="space-y-2 rounded-md bg-[var(--color-surface-2)] p-2">
                    <div className="flex items-center gap-2 text-xs">
                      <Checkbox
                        id={`pens-${m.id}`}
                        checked={p.willGoToPens}
                        onCheckedChange={(v) =>
                          update(m.id, { willGoToPens: v === true })
                        }
                        disabled={!open}
                      />
                      <Label htmlFor={`pens-${m.id}`}>Predigo penaltis (+2)</Label>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Clasificado a la siguiente ronda</Label>
                      <Select
                        value={p.winnerTeamId?.toString() ?? ""}
                        onValueChange={(v) =>
                          update(m.id, { winnerTeamId: v === "" ? null : Number(v) })
                        }
                        disabled={!open}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          {m.home ? (
                            <SelectItem value={m.home.id.toString()}>
                              {m.home.name}
                            </SelectItem>
                          ) : null}
                          {m.away ? (
                            <SelectItem value={m.away.id.toString()}>
                              {m.away.name}
                            </SelectItem>
                          ) : null}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {state.error ? (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-success)]">
          Predicción guardada. Puedes editarla hasta el cierre.
        </p>
      ) : null}

      {open ? (
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={pending}>
            <Save />
            {pending ? "Guardando…" : "Guardar predicciones"}
          </Button>
        </div>
      ) : null}
    </form>
  );
}

function TeamSide({ team }: { team: TeamLite | null }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {team?.flagUrl ? (
          <Image src={team.flagUrl} alt={team.code} width={28} height={28} />
        ) : null}
      </span>
      <span className="truncate text-sm font-medium">{team?.name ?? "—"}</span>
    </div>
  );
}
