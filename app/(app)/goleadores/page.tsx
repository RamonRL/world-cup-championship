import { Target } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchScorers, players, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Goleadores" };

export default async function ScorersPage() {
  const rows = await db
    .select({
      playerId: matchScorers.playerId,
      goals: sql<number>`count(*)::int`,
      ownGoals: sql<number>`sum(case when ${matchScorers.isOwnGoal} then 1 else 0 end)::int`,
      teamId: sql<number>`max(${matchScorers.teamId})::int`,
    })
    .from(matchScorers)
    .where(sql`${matchScorers.isOwnGoal} = false`)
    .groupBy(matchScorers.playerId)
    .orderBy(sql`count(*) desc`);

  const playerIds = rows.map((r) => r.playerId);
  const teamIds = Array.from(new Set(rows.map((r) => r.teamId)));
  const [playerRows, teamRows] = await Promise.all([
    playerIds.length > 0
      ? db.select().from(players).where(sql`id = ANY(${sql.raw(`ARRAY[${playerIds.join(",")}]::int[]`)})`)
      : Promise.resolve([]),
    teamIds.length > 0
      ? db.select().from(teams).where(sql`id = ANY(${sql.raw(`ARRAY[${teamIds.join(",")}]::int[]`)})`)
      : Promise.resolve([]),
  ]);
  const playerById = new Map(playerRows.map((p) => [p.id, p]));
  const teamById = new Map(teamRows.map((t) => [t.id, t]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Bota de Oro"
        title="Goleadores del torneo"
        description="Top en directo. La Bota de Oro la gana el primero al cierre del torneo."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Target className="size-5" />}
          title="Sin goles aún"
          description="Cuando se carguen los primeros partidos, aparecerá aquí el ranking de goleadores."
        />
      ) : (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">#</TableHead>
                <TableHead>Jugador</TableHead>
                <TableHead>Selección</TableHead>
                <TableHead className="text-right">Goles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => {
                const player = playerById.get(r.playerId);
                const team = teamById.get(r.teamId);
                return (
                  <TableRow key={r.playerId}>
                    <TableCell className="font-display text-lg">{i + 1}</TableCell>
                    <TableCell className="font-medium">{player?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{team?.code ?? "?"}</Badge>{" "}
                      <span className="text-sm text-[var(--color-muted-foreground)]">
                        {team?.name ?? ""}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-display text-xl tabular-nums">
                      {r.goals}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
