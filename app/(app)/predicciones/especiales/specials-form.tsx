"use client";

import { useActionState, useState } from "react";
import { Lock, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { saveSpecialPredictions, type FormState } from "./actions";

const initial: FormState = { ok: false };

type SpecialType = "yes_no" | "single_choice" | "team_with_round" | "number_range" | "player";

type SpecialDef = {
  id: number;
  key: string;
  question: string;
  type: SpecialType;
  optionsJson: unknown;
  closesAt: string;
};

type Existing = { specialId: number; valueJson: Record<string, unknown> };

type Props = {
  specials: SpecialDef[];
  existing: Existing[];
  players: { id: number; name: string; position: string | null; teamId: number }[];
  teams: { id: number; code: string; name: string }[];
};

export function SpecialsForm({ specials, existing, players, teams }: Props) {
  const initialMap: Record<number, Record<string, unknown>> = Object.fromEntries(
    specials.map((s) => [s.id, {}]),
  );
  for (const e of existing) initialMap[e.specialId] = e.valueJson;

  const [values, setValues] = useState(initialMap);
  const [state, action, pending] = useActionState(saveSpecialPredictions, initial);

  const payload = {
    predictions: specials.map((s) => ({
      specialId: s.id,
      valueJson: values[s.id] ?? {},
    })),
  };

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="payload" value={JSON.stringify(payload)} />
      <div className="grid gap-4">
        {specials.map((s) => {
          const open = new Date(s.closesAt).getTime() > Date.now();
          return (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-[0.65rem] uppercase">
                      {s.type.replace(/_/g, " ")}
                    </Badge>
                    <CardTitle className="text-base">{s.question}</CardTitle>
                    <CardDescription>
                      Cierra {formatDateTime(s.closesAt)}
                    </CardDescription>
                  </div>
                  {!open ? (
                    <Badge variant="warning" className="gap-1 text-[0.6rem]">
                      <Lock className="size-3" />
                      Cerrada
                    </Badge>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent>
                <FieldFor
                  special={s}
                  value={values[s.id] ?? {}}
                  onChange={(v) =>
                    setValues((prev) => ({ ...prev, [s.id]: v }))
                  }
                  disabled={!open}
                  players={players}
                  teams={teams}
                />
              </CardContent>
            </Card>
          );
        })}
      </div>

      {state.error ? <p className="text-sm text-[var(--color-danger)]">{state.error}</p> : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-success)]">Predicciones guardadas.</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          <Save />
          {pending ? "Guardando…" : "Guardar especiales"}
        </Button>
      </div>
    </form>
  );
}

function FieldFor({
  special,
  value,
  onChange,
  disabled,
  players,
  teams,
}: {
  special: SpecialDef;
  value: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
  disabled: boolean;
  players: { id: number; name: string; position: string | null; teamId: number }[];
  teams: { id: number; code: string; name: string }[];
}) {
  switch (special.type) {
    case "yes_no": {
      const v = value.value as boolean | undefined;
      return (
        <RadioGroup
          value={v == null ? "" : v ? "yes" : "no"}
          onValueChange={(val) => onChange({ value: val === "yes" })}
          disabled={disabled}
        >
          <div className="flex gap-6">
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="yes" />
              Sí
            </Label>
            <Label className="flex items-center gap-2">
              <RadioGroupItem value="no" />
              No
            </Label>
          </div>
        </RadioGroup>
      );
    }
    case "number_range": {
      const tolerance = (special.optionsJson as { tolerance?: number } | null)?.tolerance ?? 0;
      const v = value.value as number | undefined;
      return (
        <div className="space-y-1.5">
          <Input
            type="number"
            value={v ?? ""}
            onChange={(e) =>
              onChange({ value: e.target.value === "" ? null : Number(e.target.value) })
            }
            disabled={disabled}
            placeholder="Tu cifra"
          />
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Tolerancia: ±{tolerance}.
          </p>
        </div>
      );
    }
    case "single_choice": {
      const opts = (special.optionsJson as { values?: string[] } | null)?.values ?? [];
      const v = (value.value as string | undefined) ?? "";
      return (
        <Select
          value={v}
          onValueChange={(val) => onChange({ value: val })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona una opción" />
          </SelectTrigger>
          <SelectContent>
            {opts.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    case "team_with_round": {
      const opts = special.optionsJson as { teamCodes?: string[]; rounds?: string[] } | null;
      const teamCode = (value.teamCode as string | undefined) ?? "";
      const round = (value.round as string | undefined) ?? "";
      const allowedTeams = teams.filter((t) => opts?.teamCodes?.includes(t.code));
      const rounds = opts?.rounds ?? [];
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Selección</Label>
            <Select
              value={teamCode}
              onValueChange={(val) =>
                onChange({ ...value, teamCode: val })
              }
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {allowedTeams.map((t) => (
                  <SelectItem key={t.code} value={t.code}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Hasta qué ronda</Label>
            <Select
              value={round}
              onValueChange={(val) => onChange({ ...value, round: val })}
              disabled={disabled}
            >
              <SelectTrigger>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((r) => (
                  <SelectItem key={r} value={r}>
                    {ROUND_LABEL[r] ?? r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    case "player": {
      const positionFilter = (special.optionsJson as { positionFilter?: string } | null)
        ?.positionFilter;
      const candidates = positionFilter
        ? players.filter((p) => p.position === positionFilter)
        : players;
      const v = (value.playerId as number | undefined) ?? "";
      return (
        <Select
          value={v?.toString() ?? ""}
          onValueChange={(val) => onChange({ playerId: Number(val) })}
          disabled={disabled}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un jugador" />
          </SelectTrigger>
          <SelectContent>
            {candidates.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>
                {p.name}
                {p.position ? ` · ${p.position}` : ""}
              </SelectItem>
            ))}
            {candidates.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-[var(--color-muted-foreground)]">
                Aún no hay candidatos cargados.
              </div>
            ) : null}
          </SelectContent>
        </Select>
      );
    }
  }
}

const ROUND_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  final: "Final",
  champion: "Campeón",
};
