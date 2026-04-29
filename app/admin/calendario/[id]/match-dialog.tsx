"use client";

import { useActionState, useState } from "react";
import { Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { upsertMatch, type FormState } from "../actions";

const initial: FormState = { ok: false };

type Team = { id: number; code: string; name: string };
type Group = { id: number; code: string; name: string };

type Props = {
  matchdayId: number;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  teams: Team[];
  groups: Group[];
};

export function MatchDialog({ matchdayId, stage, teams, groups }: Props) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(upsertMatch, initial);
  if (state.ok) setOpen(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Añadir partido
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo partido</DialogTitle>
          <DialogDescription>
            Define equipos, sede y hora. El admin puede dejar selecciones vacías hasta que
            terminen las rondas previas.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <input type="hidden" name="matchdayId" value={matchdayId} />
          <input type="hidden" name="stage" value={stage} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="code">Código</Label>
              <Input
                id="code"
                name="code"
                placeholder="M01"
                required
                maxLength={16}
                className="uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="groupId">Grupo (si fase grupos)</Label>
              <Select name="groupId">
                <SelectTrigger id="groupId">
                  <SelectValue placeholder="Sin grupo" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id.toString()}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="homeTeamId">Local</Label>
              <Select name="homeTeamId">
                <SelectTrigger id="homeTeamId">
                  <SelectValue placeholder="Sin definir" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="awayTeamId">Visitante</Label>
              <Select name="awayTeamId">
                <SelectTrigger id="awayTeamId">
                  <SelectValue placeholder="Sin definir" />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id.toString()}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="scheduledAt">Hora del partido</Label>
              <Input id="scheduledAt" name="scheduledAt" type="datetime-local" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="venue">Sede</Label>
              <Input id="venue" name="venue" placeholder="MetLife Stadium" />
            </div>
          </div>
          {state.error ? (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button variant="ghost" type="button" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              <Save />
              Guardar partido
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
