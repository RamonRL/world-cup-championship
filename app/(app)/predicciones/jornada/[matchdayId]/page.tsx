import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches, predMatchResult, teams } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page-header";
import { Lock } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";
import { getMatchdayState, type Stage } from "@/lib/matchday-state";
import { EmptyState } from "@/components/shell/empty-state";
import { MatchdayPredictionForm } from "./matchday-form";

export default async function PredictMatchdayPage({
  params,
}: {
  params: Promise<{ matchdayId: string }>;
}) {
  const me = await requireUser();
  const { matchdayId: idParam } = await params;
  const matchdayId = Number(idParam);
  if (!Number.isFinite(matchdayId)) notFound();
  const [day] = await db
    .select()
    .from(matchdays)
    .where(eq(matchdays.id, matchdayId))
    .limit(1);
  if (!day) notFound();

  const status = await getMatchdayState({
    stage: day.stage as Stage,
    predictionDeadlineAt: day.predictionDeadlineAt,
  });

  if (status.state === "waiting") {
    return (
      <div className="space-y-6">
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="px-0 text-[var(--color-muted-foreground)]"
        >
          <Link href="/predicciones/jornada">
            <ArrowLeft />
            Volver a jornadas
          </Link>
        </Button>
        <PageHeader eyebrow={day.stage.toUpperCase()} title={day.name} description={status.reason} />
        <EmptyState
          icon={<Lock className="size-5" />}
          title="Bloqueada"
          description={`${status.reason} Cuando se desbloquee tendrás hasta ${formatDateTime(day.predictionDeadlineAt)} para predecir.`}
        />
      </div>
    );
  }

  const matchRows = await db
    .select()
    .from(matches)
    .where(eq(matches.matchdayId, matchdayId))
    .orderBy(asc(matches.scheduledAt));

  const teamIds = matchRows
    .flatMap((m) => [m.homeTeamId, m.awayTeamId])
    .filter((x): x is number => x != null);
  const allTeams =
    teamIds.length > 0
      ? await db.select().from(teams).where(inArray(teams.id, teamIds))
      : [];
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  const myPreds = await db
    .select()
    .from(predMatchResult)
    .where(
      and(
        eq(predMatchResult.userId, me.id),
        inArray(
          predMatchResult.matchId,
          matchRows.map((m) => m.id),
        ),
      ),
    );
  const predByMatch = new Map(myPreds.map((p) => [p.matchId, p]));

  const open = status.state === "open";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/predicciones">
          <ArrowLeft />
          Mis predicciones
        </Link>
      </Button>
      <PageHeader
        eyebrow={day.stage.toUpperCase()}
        title={day.name}
        description={
          open
            ? `Cierra el ${formatDateTime(day.predictionDeadlineAt)}. Después no podrás editar.`
            : `Cierre pasado: ${formatDateTime(day.predictionDeadlineAt)}.`
        }
      />
      <MatchdayPredictionForm
        matchdayId={day.id}
        open={open}
        matches={matchRows.map((m) => ({
          id: m.id,
          stage: m.stage,
          scheduledAt: m.scheduledAt.toISOString(),
          venue: m.venue,
          home: m.homeTeamId
            ? {
                id: m.homeTeamId,
                name: teamById.get(m.homeTeamId)?.name ?? "—",
                code: teamById.get(m.homeTeamId)?.code ?? "—",
                flagUrl: teamById.get(m.homeTeamId)?.flagUrl ?? null,
              }
            : null,
          away: m.awayTeamId
            ? {
                id: m.awayTeamId,
                name: teamById.get(m.awayTeamId)?.name ?? "—",
                code: teamById.get(m.awayTeamId)?.code ?? "—",
                flagUrl: teamById.get(m.awayTeamId)?.flagUrl ?? null,
              }
            : null,
          existing: predByMatch.get(m.id)
            ? {
                homeScore: predByMatch.get(m.id)!.homeScore,
                awayScore: predByMatch.get(m.id)!.awayScore,
                willGoToPens: predByMatch.get(m.id)!.willGoToPens,
                winnerTeamId: predByMatch.get(m.id)!.winnerTeamId ?? null,
              }
            : null,
        }))}
      />
    </div>
  );
}
