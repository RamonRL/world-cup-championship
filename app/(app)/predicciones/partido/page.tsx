import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ClipboardList } from "lucide-react";
import { and, asc, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predMatchScorer, players, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Goleador por partido · Predicciones" };

export default async function PredictMatchScorerIndex() {
  const me = await requireUser();
  // Show next ~20 matches that haven't kicked off yet.
  const now = new Date();
  const upcoming = await db
    .select()
    .from(matches)
    .where(gte(matches.scheduledAt, now))
    .orderBy(asc(matches.scheduledAt))
    .limit(20);

  const teamIds = upcoming
    .flatMap((m) => [m.homeTeamId, m.awayTeamId])
    .filter((x): x is number => x != null);
  const allTeams =
    teamIds.length > 0
      ? await db.select().from(teams).where(inArray(teams.id, teamIds))
      : [];
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  const matchIds = upcoming.map((m) => m.id);
  const myPreds =
    matchIds.length > 0
      ? await db
          .select()
          .from(predMatchScorer)
          .where(and(eq(predMatchScorer.userId, me.id), inArray(predMatchScorer.matchId, matchIds)))
      : [];
  const playerIds = myPreds.map((p) => p.playerId);
  const playerRows =
    playerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, playerIds))
      : [];
  const playerById = new Map(playerRows.map((p) => [p.id, p]));
  const predByMatch = new Map(myPreds.map((p) => [p.matchId, p]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 5"
        title="Goleador por partido"
        description="Antes de cada partido elige un jugador que marcará. 4 pts si marca, +2 si es el primero. Cierre: el inicio del partido."
      />
      {upcoming.length === 0 ? (
        <EmptyState
          icon={<ClipboardList className="size-5" />}
          title="No hay partidos próximos"
          description="Cuando el admin programe partidos del Mundial, aparecerán aquí para predecir."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {upcoming.map((m) => {
            const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
            const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
            const myPred = predByMatch.get(m.id);
            const myPlayer = myPred ? playerById.get(myPred.playerId) : null;
            return (
              <Link key={m.id} href={`/predicciones/partido/${m.id}`}>
                <Card className="transition-colors hover:border-[var(--color-primary)]/50">
                  <CardHeader className="flex flex-row items-center justify-between gap-2 p-4">
                    <Badge variant="outline" className="text-[0.65rem] uppercase">
                      {m.stage}
                    </Badge>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDateTime(m.scheduledAt, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </CardHeader>
                  <CardContent className="space-y-2 p-4 pt-0">
                    <TeamLine team={home} />
                    <TeamLine team={away} />
                    <CardDescription className="flex items-center justify-between pt-2">
                      <span>
                        {myPlayer ? (
                          <>
                            Tu pick:{" "}
                            <span className="font-medium text-[var(--color-foreground)]">
                              {myPlayer.name}
                            </span>
                          </>
                        ) : (
                          "Sin pick"
                        )}
                      </span>
                      <ArrowRight className="size-4 text-[var(--color-muted-foreground)]" />
                    </CardDescription>
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

function TeamLine({
  team,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="grid size-6 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {team?.flagUrl ? (
          <Image src={team.flagUrl} alt={team.code} width={24} height={24} />
        ) : null}
      </span>
      <span className="text-sm font-medium">{team?.name ?? "—"}</span>
    </div>
  );
}
