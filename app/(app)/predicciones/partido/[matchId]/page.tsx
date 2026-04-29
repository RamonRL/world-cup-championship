import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, players, predMatchScorer, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { MatchScorerForm } from "./scorer-form";

export default async function PredictMatchScorerPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const me = await requireUser();
  const { matchId: idParam } = await params;
  const matchId = Number(idParam);
  if (!Number.isFinite(matchId)) notFound();
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  const involvedTeamIds = [match.homeTeamId, match.awayTeamId].filter(
    (x): x is number => x != null,
  );
  const [allTeams, matchPlayers, mine] = await Promise.all([
    involvedTeamIds.length > 0
      ? db.select().from(teams).where(inArray(teams.id, involvedTeamIds))
      : Promise.resolve([]),
    involvedTeamIds.length > 0
      ? db
          .select()
          .from(players)
          .where(inArray(players.teamId, involvedTeamIds))
          .orderBy(asc(players.jerseyNumber))
      : Promise.resolve([]),
    db
      .select()
      .from(predMatchScorer)
      .where(and(eq(predMatchScorer.userId, me.id), eq(predMatchScorer.matchId, matchId)))
      .limit(1),
  ]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const home = match.homeTeamId ? teamById.get(match.homeTeamId) : null;
  const away = match.awayTeamId ? teamById.get(match.awayTeamId) : null;
  const open = new Date(match.scheduledAt).getTime() > Date.now();

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/predicciones/partido">
          <ArrowLeft />
          Volver a partidos
        </Link>
      </Button>
      <PageHeader
        eyebrow={match.stage.toUpperCase()}
        title={`${home?.name ?? "—"} vs ${away?.name ?? "—"}`}
        description={
          open
            ? `Cierra ${new Date(match.scheduledAt).toLocaleString("es-ES")}.`
            : "Predicción cerrada."
        }
      />
      <div className="flex items-center justify-center gap-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <TeamMark team={home} />
        <span className="font-display text-3xl text-[var(--color-muted-foreground)]">vs</span>
        <TeamMark team={away} />
      </div>

      <MatchScorerForm
        matchId={match.id}
        open={open}
        homeTeam={home ? { id: home.id, name: home.name, code: home.code } : null}
        awayTeam={away ? { id: away.id, name: away.name, code: away.code } : null}
        players={matchPlayers.map((p) => ({
          id: p.id,
          teamId: p.teamId,
          name: p.name,
          jerseyNumber: p.jerseyNumber,
          position: p.position,
          photoUrl: p.photoUrl,
        }))}
        existingPlayerId={mine[0]?.playerId ?? null}
      />

      <div className="space-y-2 rounded-lg bg-[var(--color-surface-2)] p-4 text-sm">
        <p className="font-medium">Cómo se puntúa</p>
        <ul className="space-y-1 text-[var(--color-muted-foreground)]">
          <li>· 4 pts si tu jugador anota.</li>
          <li>· +2 pts si además es el primer gol del partido.</li>
        </ul>
      </div>
    </div>
  );
}

function TeamMark({
  team,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-12 place-items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {team?.flagUrl ? (
          <Image src={team.flagUrl} alt={team.code} width={48} height={48} />
        ) : null}
      </span>
      <span className="font-medium">{team?.name ?? "—"}</span>
      <Badge variant="outline">{team?.code ?? "?"}</Badge>
    </div>
  );
}
