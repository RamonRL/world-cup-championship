import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchScorers, matches } from "@/lib/db/schema";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Estadísticas" };

export default async function StatsPage() {
  const [matchAgg] = await db
    .select({
      played: sql<number>`count(*) filter (where status = 'finished')::int`,
      total: sql<number>`count(*)::int`,
    })
    .from(matches);

  const [scorerCount] = await db
    .select({ goals: sql<number>`count(*)::int` })
    .from(matchScorers);

  const [drawsRow] = await db
    .select({
      draws: sql<number>`count(*) filter (where home_score = away_score and status = 'finished')::int`,
      penalties: sql<number>`count(*) filter (where went_to_pens)::int`,
      over6: sql<number>`count(*) filter (where home_score + away_score > 6)::int`,
    })
    .from(matches);

  if (matchAgg.played === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Datos del torneo"
          title="Estadísticas"
          description="Goles, empates, tandas de penaltis y partidos goleadores. Calculado en directo desde los resultados."
        />
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="Sin datos todavía"
          description="Aparecerán aquí cuando el admin guarde el primer resultado."
        />
      </div>
    );
  }

  const avg = (scorerCount.goals / matchAgg.played).toFixed(2);

  const stats = [
    {
      label: "Partidos jugados",
      value: matchAgg.played,
      hint: `de ${matchAgg.total}`,
    },
    {
      label: "Goles totales",
      value: scorerCount.goals,
      hint: `${avg} por partido`,
      accent: true,
    },
    {
      label: "Empates en 90'",
      value: drawsRow.draws,
      hint: "antes de prórroga / penaltis",
    },
    {
      label: "Tandas de penaltis",
      value: drawsRow.penalties,
      hint: "decididas en 11 metros",
    },
    {
      label: "Partidos +6 goles",
      value: drawsRow.over6,
      hint: "festival de gol",
    },
  ];

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Datos del torneo"
        title="Estadísticas"
        description="Cifras agregadas en directo. Se actualizan cada vez que el admin guarda un resultado."
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <article
            key={s.label}
            className={`relative overflow-hidden rounded-xl border p-6 ${
              s.accent
                ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))]"
                : "border-[var(--color-border)] bg-[var(--color-surface)]"
            }`}
          >
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              {s.label}
            </p>
            <p
              className={`mt-3 font-display tabular text-7xl leading-none tracking-tight ${
                s.accent ? "text-[var(--color-arena)] glow-arena" : ""
              }`}
            >
              {s.value}
            </p>
            <p className="mt-2 font-editorial text-sm italic text-[var(--color-muted-foreground)]">
              {s.hint}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
