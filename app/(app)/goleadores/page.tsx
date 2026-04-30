import { Crown, Target } from "lucide-react";
import { inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchScorers, players, teams } from "@/lib/db/schema";
import { TeamFlag } from "@/components/brand/team-flag";
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
      ? db.select().from(players).where(inArray(players.id, playerIds))
      : Promise.resolve([]),
    teamIds.length > 0
      ? db.select().from(teams).where(inArray(teams.id, teamIds))
      : Promise.resolve([]),
  ]);
  const playerById = new Map(playerRows.map((p) => [p.id, p]));
  const teamById = new Map(teamRows.map((t) => [t.id, t]));

  const totalGoals = rows.reduce((s, r) => s + r.goals, 0);
  const topGoals = rows[0]?.goals ?? 0;

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
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <SummaryStat label="Goleadores" value={rows.length.toString()} />
            <SummaryStat label="Goles totales" value={totalGoals.toString()} accent />
            <SummaryStat label="Máxima goleador" value={topGoals.toString()} hint="goles del líder" />
          </section>

          <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <header className="hidden grid-cols-[56px_1fr_56px] items-center gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)] sm:grid">
              <span>Pos</span>
              <span>Jugador</span>
              <span className="text-right">Goles</span>
            </header>
            <ul>
              {rows.map((r, i) => {
                const player = playerById.get(r.playerId);
                const team = teamById.get(r.teamId);
                const position = i + 1;
                const podium = position === 1 ? "gold" : position === 2 ? "silver" : position === 3 ? "bronze" : null;
                return (
                  <li
                    key={r.playerId}
                    className={`flex items-center gap-3 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[56px_1fr_56px] ${
                      position === 1
                        ? "bg-[color-mix(in_oklch,var(--color-arena)_6%,transparent)]"
                        : ""
                    }`}
                  >
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span
                        className={`font-display tabular text-2xl ${
                          podium === "gold"
                            ? "text-[var(--color-arena)] glow-arena"
                            : podium === "silver"
                              ? "text-[var(--color-foreground)]"
                              : podium === "bronze"
                                ? "text-[var(--color-foreground)]/80"
                                : "text-[var(--color-muted-foreground)]"
                        }`}
                      >
                        {position.toString().padStart(2, "0")}
                      </span>
                      {podium === "gold" ? (
                        <Crown className="size-3.5 text-[var(--color-arena)]" />
                      ) : null}
                    </span>
                    <span className="flex min-w-0 items-center gap-3">
                      <TeamFlag code={team?.code} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate font-display text-base tracking-tight">
                          {player?.name ?? "—"}
                        </span>
                        <span className="block truncate font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                          {team?.code ?? "—"}
                          {player?.position ? ` · ${player.position}` : ""}
                          {team?.name ? ` · ${team.name}` : ""}
                        </span>
                      </span>
                    </span>
                    <span
                      className={`shrink-0 font-display tabular text-3xl tracking-tight sm:text-right ${
                        podium === "gold" ? "text-[var(--color-arena)] glow-arena" : ""
                      }`}
                    >
                      {r.goals}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}

function SummaryStat({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-2 font-display tabular text-4xl tracking-tight ${
          accent ? "text-[var(--color-arena)] glow-arena" : ""
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
    </div>
  );
}
