import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Resultados por jornada · Predicciones" };

export default async function MatchdaysIndex() {
  const days = await db
    .select()
    .from(matchdays)
    .orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 4"
        title="Resultados por jornada"
        description="5 puntos por marcador exacto, 2 puntos por acertar el ganador. En eliminatorias, además, +3 por clasificado y +2 si va a penaltis."
      />
      {days.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="No hay jornadas creadas"
          description="El admin todavía no ha publicado las jornadas. Cuando lo haga, aquí podrás predecirlas."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {days.map((d) => {
            const open = new Date(d.predictionDeadlineAt).getTime() > Date.now();
            return (
              <Link key={d.id} href={`/predicciones/jornada/${d.id}`}>
                <Card className="transition-colors hover:border-[var(--color-primary)]/50">
                  <CardHeader className="flex flex-row items-start justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <Badge variant="outline" className="text-[0.65rem] uppercase">
                        {d.stage}
                      </Badge>
                      <CardTitle className="mt-1 text-base">{d.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Cierra {formatDateTime(d.predictionDeadlineAt)}
                      </CardDescription>
                    </div>
                    <Badge variant={open ? "success" : "outline"} className="text-[0.65rem]">
                      {open ? "Abierta" : "Cerrada"}
                    </Badge>
                  </CardHeader>
                  <CardContent className="flex justify-end p-4 pt-0">
                    <ArrowRight className="size-4 text-[var(--color-muted-foreground)]" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
