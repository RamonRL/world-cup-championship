import { Crown, Target } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchScorers, players, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Goleadores" };

export default async function ScorersPage() {
  const rows = await db
    .select({
      playerId: matchScorers.playerId,
      goals: sql<number>`count(*)::int`,
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
    <div className="space-y-8">
      <PageHeader
        eyebrow="Bota de Oro"
        title="Goleadores del torneo"
        description="Top en directo. La Bota de Oro va al primero al cierre del torneo · 15 / 5 / 2 puntos según posición predicha."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<Target className="size-5" />}
          title="Sin goles aún"
          description="Cuando se carguen los primeros partidos, aparecerá aquí el ranking de goleadores."
        />
      ) : (
        <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-[60px_1fr_140px_60px] items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            <span>Pos</span>
            <span>Jugador</span>
            <span>Selección</span>
            <span className="text-right">Goles</span>
          </div>
          <ul>
            {rows.map((r, i) => {
              const player = playerById.get(r.playerId);
              const team = teamById.get(r.teamId);
              const position = i + 1;
              return (
                <li
                  key={r.playerId}
                  className={`grid grid-cols-[60px_1fr_140px_60px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 ${
                    position === 1
                      ? "bg-[color-mix(in_oklch,var(--color-arena)_6%,transparent)]"
                      : ""
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <span
                      className={`font-display tabular text-2xl ${
                        position === 1
                          ? "text-[var(--color-arena)] glow-arena"
                          : position <= 3
                            ? "text-[var(--color-foreground)]"
                            : "text-[var(--color-muted-foreground)]"
                      }`}
                    >
                      {position.toString().padStart(2, "0")}
                    </span>
                    {position === 1 ? <Crown className="size-3.5 text-[var(--color-arena)]" /> : null}
                  </span>
                  <span className="truncate font-display text-base tracking-tight">
                    {player?.name ?? "—"}
                    {player?.position ? (
                      <span className="ml-2 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        {player.position}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex items-center gap-2">
                    <Badge variant="outline">{team?.code ?? "?"}</Badge>
                    <span className="hidden truncate text-xs text-[var(--color-muted-foreground)] sm:inline">
                      {team?.name ?? ""}
                    </span>
                  </span>
                  <span
                    className={`text-right font-display tabular text-3xl tracking-tight ${
                      position === 1 ? "text-[var(--color-arena)] glow-arena" : ""
                    }`}
                  >
                    {r.goals}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
