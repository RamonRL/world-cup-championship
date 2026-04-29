import Link from "next/link";
import { ArrowRight, CalendarPlus } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { MatchdayDialog } from "./matchday-dialog";

export const metadata = { title: "Calendario · Admin" };

export default async function AdminCalendarioPage() {
  const [days, matchRows] = await Promise.all([
    db.select().from(matchdays).orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt)),
    db.select().from(matches).orderBy(asc(matches.scheduledAt)),
  ]);

  const countByMatchday = new Map<number, number>();
  for (const m of matchRows) {
    if (m.matchdayId) countByMatchday.set(m.matchdayId, (countByMatchday.get(m.matchdayId) ?? 0) + 1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Admin"
        title="Calendario"
        description="Crea las jornadas y los partidos del Mundial. La fecha límite de cada jornada es cuándo se cierran las predicciones de marcadores."
        actions={<MatchdayDialog />}
      />

      {days.length === 0 ? (
        <EmptyState
          icon={<CalendarPlus className="size-5" />}
          title="Crea tu primera jornada"
          description="Una jornada agrupa varios partidos y tiene un único deadline de predicción."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {days.map((d) => {
            const count = countByMatchday.get(d.id) ?? 0;
            return (
              <Card key={d.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="outline" className="uppercase">
                      {d.stage}
                    </Badge>
                    <CardTitle>{d.name}</CardTitle>
                    <CardDescription>
                      Cierre: {new Date(d.predictionDeadlineAt).toLocaleString("es-ES")}
                    </CardDescription>
                  </div>
                  <span className="font-display text-3xl text-[var(--color-muted-foreground)]">
                    {count}
                  </span>
                </CardHeader>
                <CardContent className="flex justify-between text-sm">
                  <span className="text-[var(--color-muted-foreground)]">
                    {count} partidos
                  </span>
                  <Link
                    href={`/admin/calendario/${d.id}`}
                    className="flex items-center gap-1 text-[var(--color-primary)] hover:underline"
                  >
                    Gestionar partidos <ArrowRight className="size-4" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
