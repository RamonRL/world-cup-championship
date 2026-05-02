import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, predTournamentTopScorer, teams } from "@/lib/db/schema";
import { Target } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { ScoringBox } from "@/components/brand/scoring-box";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { formatDateTime } from "@/lib/utils";
import { TOP_SCORER_SCORING } from "@/lib/scoring/copy";
import { TopScorerForm } from "./top-scorer-form";

export const metadata = { title: "Bota de Oro · Predicciones" };

const KICKOFF = new Date(
  process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z",
);

export default async function PredictTopScorerPage() {
  const me = await requireUser();
  const leagueId = (await currentLeagueId(me))!;
  const [allPlayers, allTeams, mine] = await Promise.all([
    db.select().from(players).orderBy(asc(players.name)),
    db.select().from(teams),
    db
      .select()
      .from(predTournamentTopScorer)
      .where(
        and(
          eq(predTournamentTopScorer.userId, me.id),
          eq(predTournamentTopScorer.leagueId, leagueId),
        ),
      )
      .limit(1),
  ]);

  if (allPlayers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categoría 3"
          title="Bota de Oro"
          description="Tu candidato al máximo goleador del torneo."
        />
        <ScoringBox sections={TOP_SCORER_SCORING} />
        <EmptyState
          icon={<Target className="size-5" />}
          title="Aún no hay jugadores cargados"
          description="El admin tiene que subir las plantillas antes de que puedas elegir candidato."
        />
      </div>
    );
  }

  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const open = KICKOFF.getTime() > Date.now();
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 3"
        title="Bota de Oro"
        description={
          open
            ? `Tu candidato al máximo goleador. Cierra ${formatDateTime(KICKOFF)}.`
            : "Cerrada."
        }
      />
      <ScoringBox sections={TOP_SCORER_SCORING} />
      <TopScorerForm
        open={open}
        existingPlayerId={mine[0]?.playerId ?? null}
        players={allPlayers.map((p) => {
          const t = teamById.get(p.teamId);
          return {
            id: p.id,
            name: p.name,
            position: p.position,
            jerseyNumber: p.jerseyNumber,
            photoUrl: p.photoUrl,
            teamCode: t?.code ?? "?",
            teamName: t?.name ?? "—",
          };
        })}
      />
    </div>
  );
}
