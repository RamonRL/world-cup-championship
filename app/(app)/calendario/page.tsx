import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Calendario" };

const STAGE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

export default async function CalendarPage() {
  const [days, matchRows, allTeams] = await Promise.all([
    db
      .select()
      .from(matchdays)
      .orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt)),
    db.select().from(matches).orderBy(asc(matches.scheduledAt)),
    db.select().from(teams),
  ]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const matchesByDay = new Map<number | null, typeof matchRows>();
  for (const m of matchRows) {
    const arr = matchesByDay.get(m.matchdayId) ?? [];
    arr.push(m);
    matchesByDay.set(m.matchdayId, arr);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Mundial 2026"
        title="Calendario"
        description="Todos los partidos por jornada. Pulsa cada partido para ver detalles, alineaciones y comentarios."
      />
      {days.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Calendario aún sin cargar"
          description="El admin todavía no ha publicado las jornadas."
        />
      ) : (
        <div className="space-y-6">
          {days.map((d) => {
            const dayMatches = matchesByDay.get(d.id) ?? [];
            return (
              <div key={d.id} className="space-y-2">
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <Badge variant="outline" className="uppercase">
                      {STAGE_LABEL[d.stage] ?? d.stage}
                    </Badge>
                    <h2 className="mt-1 font-display text-2xl">{d.name}</h2>
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    Cierre predicción ·{" "}
                    {new Date(d.predictionDeadlineAt).toLocaleString("es-ES")}
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {dayMatches.map((m) => {
                    const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                    const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                    return (
                      <Link key={m.id} href={`/partido/${m.id}`}>
                        <Card className="transition-colors hover:border-[var(--color-primary)]/40">
                          <CardHeader className="flex flex-row items-center justify-between p-4">
                            <span className="text-xs text-[var(--color-muted-foreground)]">
                              {new Date(m.scheduledAt).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <Badge
                              variant={
                                m.status === "finished"
                                  ? "success"
                                  : m.status === "live"
                                    ? "warning"
                                    : "outline"
                              }
                              className="text-[0.65rem]"
                            >
                              {m.status === "finished"
                                ? "Final"
                                : m.status === "live"
                                  ? "En juego"
                                  : "Programado"}
                            </Badge>
                          </CardHeader>
                          <CardContent className="space-y-2 p-4 pt-0">
                            <TeamRow team={home} score={m.homeScore} />
                            <TeamRow team={away} score={m.awayScore} />
                          </CardContent>
                        </Card>
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TeamRow({
  team,
  score,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
  score: number | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="grid size-6 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          {team?.flagUrl ? (
            <Image src={team.flagUrl} alt={team.code} width={24} height={24} />
          ) : null}
        </span>
        <span className="font-medium">{team?.name ?? "—"}</span>
      </div>
      <span className="font-display text-xl tabular-nums">
        {score != null ? score : <span className="text-[var(--color-muted-foreground)]">·</span>}
      </span>
    </div>
  );
}
