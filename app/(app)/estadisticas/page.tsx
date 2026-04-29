import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchScorers, matches } from "@/lib/db/schema";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { BarChart3 } from "lucide-react";

export const metadata = { title: "Estadísticas" };

export default async function StatsPage() {
  const [matchAgg] = await db
    .select({
      played: sql<number>`count(*) filter (where status = 'finished')::int`,
      total: sql<number>`count(*)::int`,
      goals: sql<number>`coalesce(sum(home_score) + sum(away_score), 0)::int`,
    })
    .from(matches);

  const [scorerCount] = await db
    .select({ goals: sql<number>`count(*)::int` })
    .from(matchScorers);

  const drawsRow = await db
    .select({
      draws: sql<number>`count(*) filter (where home_score = away_score and status = 'finished')::int`,
      penalties: sql<number>`count(*) filter (where went_to_pens)::int`,
      over6: sql<number>`count(*) filter (where home_score + away_score > 6)::int`,
    })
    .from(matches);
  const draws = drawsRow[0];

  const stats = [
    { label: "Partidos jugados", value: matchAgg.played, sub: `de ${matchAgg.total}` },
    {
      label: "Goles totales",
      value: scorerCount.goals,
      sub:
        matchAgg.played > 0
          ? `${(scorerCount.goals / matchAgg.played).toFixed(2)} por partido`
          : "0 por partido",
    },
    { label: "Empates", value: draws.draws, sub: "(en 90′)" },
    { label: "Tandas de penaltis", value: draws.penalties, sub: "decididos así" },
    { label: "Partidos con +6 goles", value: draws.over6, sub: "" },
  ];

  if (matchAgg.played === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Datos del torneo"
          title="Estadísticas"
          description="Goles totales, empates, tandas de penaltis y partidos goleadores."
        />
        <EmptyState
          icon={<BarChart3 className="size-5" />}
          title="Sin datos todavía"
          description="Aparecerán aquí cuando el admin guarde el primer resultado."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Datos del torneo"
        title="Estadísticas"
        description="Cifras agregadas en directo a partir de los resultados cargados."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader>
              <CardDescription className="text-[0.65rem] uppercase tracking-wider">
                {s.label}
              </CardDescription>
              <CardTitle className="font-display text-4xl tabular-nums">{s.value}</CardTitle>
            </CardHeader>
            {s.sub ? (
              <CardContent className="text-xs text-[var(--color-muted-foreground)]">
                {s.sub}
              </CardContent>
            ) : null}
          </Card>
        ))}
      </div>
    </div>
  );
}
