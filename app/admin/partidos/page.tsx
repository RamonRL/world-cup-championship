import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shell/page-header";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDateTime } from "@/lib/utils";
import { deleteMatch } from "@/app/admin/calendario/actions";

export const metadata = { title: "Resultados · Admin" };

export default async function AdminMatchesPage() {
  const [matchRows, allTeams] = await Promise.all([
    db.select().from(matches).orderBy(asc(matches.scheduledAt)),
    db.select().from(teams),
  ]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Resultados de partidos"
        description="Introduce el resultado de cada partido y los goleadores. Al guardar, se recalculan los puntos de todos los participantes."
      />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Cuándo</TableHead>
              <TableHead>Partido</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Resultado</TableHead>
              <TableHead className="w-20" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {matchRows.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="text-xs">
                  {formatDateTime(m.scheduledAt, {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </TableCell>
                <TableCell className="font-medium">
                  {teamById.get(m.homeTeamId ?? -1)?.name ?? "—"} vs{" "}
                  {teamById.get(m.awayTeamId ?? -1)?.name ?? "—"}
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      m.status === "finished"
                        ? "success"
                        : m.status === "live"
                          ? "warning"
                          : "outline"
                    }
                  >
                    {m.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  {m.homeScore != null && m.awayScore != null ? (
                    <span className="font-display text-lg">
                      {m.homeScore} – {m.awayScore}
                      {m.wentToPens
                        ? ` (${m.homeScorePen ?? 0}-${m.awayScorePen ?? 0} pen.)`
                        : ""}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <DeleteButton
                      action={deleteMatch}
                      id={m.id}
                      confirmMessage={`¿Eliminar el partido ${m.code}? Se borrarán también goleadores y predicciones.`}
                    />
                    <Link
                      href={`/admin/partidos/${m.id}`}
                      className="inline-flex items-center gap-1 text-sm text-[var(--color-primary)] hover:underline"
                    >
                      Editar <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {matchRows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-12 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  No hay partidos. Empieza por crear las jornadas y los partidos en{" "}
                  <Link href="/admin/calendario" className="underline">
                    Calendario
                  </Link>
                  .
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
