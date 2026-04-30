import Link from "next/link";
import { ArrowRight, CalendarDays, Lock } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";
import { computeMatchdayStates, type Stage } from "@/lib/matchday-state";

export const metadata = { title: "Resultados por jornada · Predicciones" };

export default async function MatchdaysIndex() {
  const days = await db
    .select()
    .from(matchdays)
    .orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt));

  const annotated = await computeMatchdayStates(
    days.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage as Stage,
      predictionDeadlineAt: d.predictionDeadlineAt,
    })),
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 4"
        title="Resultados por jornada"
        description="5 puntos por marcador exacto, 2 puntos por acertar el ganador. En eliminatorias, además, +3 por clasificado y +2 si va a penaltis. Las rondas se desbloquean cuando termina la anterior."
      />
      {annotated.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="No hay jornadas creadas"
          description="El admin todavía no ha publicado las jornadas. Cuando lo haga, aquí podrás predecirlas."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {annotated.map((d) => {
            const card = (
              <Card
                className={`transition-colors ${
                  d.state === "waiting"
                    ? "opacity-70"
                    : "hover:border-[var(--color-primary)]/50"
                }`}
              >
                <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <Badge variant="outline" className="text-[0.65rem] uppercase">
                      {d.stage}
                    </Badge>
                    <CardTitle className="mt-1 text-base">{d.name}</CardTitle>
                    <CardDescription className="text-xs">
                      {d.state === "waiting"
                        ? d.reason
                        : `Cierra ${formatDateTime(d.predictionDeadlineAt)}`}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      d.state === "open"
                        ? "success"
                        : d.state === "waiting"
                          ? "warning"
                          : "outline"
                    }
                    className="text-[0.65rem]"
                  >
                    {d.state === "open"
                      ? "Abierta"
                      : d.state === "waiting"
                        ? "Bloqueada"
                        : "Cerrada"}
                  </Badge>
                </CardHeader>
                <CardContent className="flex items-center justify-end gap-1 p-4 pt-0 text-xs text-[var(--color-muted-foreground)]">
                  {d.state === "waiting" ? (
                    <>
                      <Lock className="size-3.5" />
                      <span>Aún no disponible</span>
                    </>
                  ) : (
                    <ArrowRight className="size-4" />
                  )}
                </CardContent>
              </Card>
            );
            return d.state === "waiting" ? (
              <div key={d.id}>{card}</div>
            ) : (
              <Link key={d.id} href={`/predicciones/jornada/${d.id}`}>
                {card}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
