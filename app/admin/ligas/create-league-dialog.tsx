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
import { createLeague, type LeagueFormState } from "@/lib/league-actions";

const initial: LeagueFormState = { ok: false };

export function CreateLeagueDialog() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(createLeague, initial);
  if (state.ok && open) setOpen(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus />
          Nueva liga
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva liga privada</DialogTitle>
          <DialogDescription>
            Recibirá un invite link único. Reenvíalo a las personas que quieras incluir; al
            registrarse con ese link quedarán atadas a esta liga.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              maxLength={60}
              placeholder="Liga de los amigos del trabajo"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Input
              id="description"
              name="description"
              maxLength={280}
              placeholder="Quiniela del Mundial entre el equipo de marketing"
            />
          </div>
          {state.error ? (
            <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              <Save />
              {pending ? "Creando…" : "Crear liga"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
