import Image from "next/image";
import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupStandings, teams } from "@/lib/db/schema";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { ArrowUpRight, Users } from "lucide-react";

export const metadata = { title: "Grupos" };

export default async function GroupsPage() {
  const [allGroups, allTeams, standings] = await Promise.all([
    db.select().from(groups).orderBy(asc(groups.code)),
    db.select().from(teams).orderBy(asc(teams.name)),
    db.select().from(groupStandings),
  ]);
  const teamsByGroup = new Map<number, typeof allTeams>();
  for (const t of allTeams) {
    if (t.groupId) {
      const arr = teamsByGroup.get(t.groupId) ?? [];
      arr.push(t);
      teamsByGroup.set(t.groupId, arr);
    }
  }
  const standingByPair = new Map<string, (typeof standings)[number]>();
  for (const s of standings) {
    standingByPair.set(`${s.groupId}-${s.teamId}`, s);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Fase de grupos"
        title="12 grupos"
        description="2 primeros + 8 mejores terceros pasan a R32. La tabla se actualiza al cierre de cada jornada."
      />
      {allGroups.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Sin grupos"
          description="El admin todavía no ha creado los grupos."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allGroups.map((g) => {
            const groupTeams = teamsByGroup.get(g.id) ?? [];
            const sorted = [...groupTeams].sort((a, b) => {
              const sa = standingByPair.get(`${g.id}-${a.id}`)?.position ?? 99;
              const sb = standingByPair.get(`${g.id}-${b.id}`)?.position ?? 99;
              return sa - sb;
            });
            return (
              <Link
                key={g.id}
                href={`/grupos/${g.code}`}
                className="group block overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-arena)]/40 hover:shadow-[var(--shadow-elev-2)]"
              >
                <header className="flex items-baseline justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
                  <div className="flex items-baseline gap-3">
                    <span className="font-display text-3xl tracking-tight text-[var(--color-arena)] glow-arena">
                      {g.code}
                    </span>
                    <span className="font-display text-xl tracking-tight">{g.name}</span>
                  </div>
                  <ArrowUpRight className="size-4 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--color-arena)]" />
                </header>

                <div className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px_36px_44px] gap-2 border-b border-[var(--color-border)] px-4 py-2 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                  <span>#</span>
                  <span>Selección</span>
                  <span className="text-right">PJ</span>
                  <span className="text-right">G</span>
                  <span className="text-right">E</span>
                  <span className="text-right">P</span>
                  <span className="text-right">GF</span>
                  <span className="text-right">GC</span>
                  <span className="text-right">Pts</span>
                </div>
                {sorted.length === 0 ? (
                  <p className="py-6 text-center font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                    Selecciones aún sin asignar.
                  </p>
                ) : (
                  <ul className="pointer-events-none">
                    {sorted.map((t, i) => {
                      const s = standingByPair.get(`${g.id}-${t.id}`);
                      const pos = i + 1;
                      const advances = pos <= 2;
                      const limbo = pos === 3;
                      return (
                        <li
                          key={t.id}
                          className={`grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px_36px_44px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5 last:border-b-0 ${
                            advances
                              ? "bg-[color-mix(in_oklch,var(--color-success)_6%,transparent)]"
                              : limbo
                                ? "bg-[color-mix(in_oklch,var(--color-accent)_6%,transparent)]"
                                : ""
                          }`}
                        >
                          <span
                            className={`font-display tabular text-base ${
                              advances ? "text-[var(--color-success)]" : "text-[var(--color-muted-foreground)]"
                            }`}
                          >
                            {pos}
                          </span>
                          <span className="flex items-center gap-2 truncate">
                            <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                              {t.flagUrl ? (
                                <Image src={t.flagUrl} alt={t.code} width={20} height={20} />
                              ) : null}
                            </span>
                            <span className="truncate text-sm font-medium">{t.name}</span>
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.played ?? 0}
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.won ?? 0}
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.drawn ?? 0}
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.lost ?? 0}
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.goalsFor ?? 0}
                          </span>
                          <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                            {s?.goalsAgainst ?? 0}
                          </span>
                          <span className="text-right font-display tabular text-lg">
                            {s?.points ?? 0}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
