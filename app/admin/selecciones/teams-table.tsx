"use client";

import { useState } from "react";
import { TeamFlag } from "@/components/brand/team-flag";
import { Pencil, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TeamForm } from "./team-form";

type Group = { id: number; code: string; name: string };
type Team = {
  id: number;
  code: string;
  name: string;
  groupId: number | null;
  flagUrl: string | null;
};

export function TeamsTable({ teams, groups }: { teams: Team[]; groups: Group[] }) {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Team | undefined>(undefined);
  const groupById = new Map(groups.map((g) => [g.id, g]));

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {teams.length} de 48 selecciones cargadas.
        </p>
        <Button
          onClick={() => {
            setEditing(undefined);
            setOpen(true);
          }}
        >
          <Plus />
          Añadir selección
        </Button>
      </div>

      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Bandera</TableHead>
              <TableHead className="w-20">Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Grupo</TableHead>
              <TableHead className="w-16 text-right">Editar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((t) => (
              <TableRow key={t.id}>
                <TableCell>
                  <TeamFlag code={t.code} size={36} />
                </TableCell>
                <TableCell className="font-mono text-sm">{t.code}</TableCell>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  {t.groupId ? (
                    <Badge variant="outline">{groupById.get(t.groupId)?.name ?? "?"}</Badge>
                  ) : (
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      Sin asignar
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(t);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="size-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {teams.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Aún no hay selecciones. Añade la primera para empezar.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>

      <TeamForm open={open} onOpenChange={setOpen} team={editing} groups={groups} />
    </>
  );
}
