import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { chatMessages, matchScorers, matches, players, profiles, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { ChatThread } from "@/app/(app)/chat/chat-thread";
import { requireUser } from "@/lib/auth/guards";

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const matchId = Number(id);
  if (!Number.isFinite(matchId)) notFound();
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match) notFound();

  const teamIds = [match.homeTeamId, match.awayTeamId].filter((x): x is number => x != null);
  const [allTeams, scorerRows] = await Promise.all([
    teamIds.length > 0
      ? db.select().from(teams).where(inArray(teams.id, teamIds))
      : Promise.resolve([]),
    db.select().from(matchScorers).where(eq(matchScorers.matchId, matchId)),
  ]);

  const playerIds = scorerRows.map((s) => s.playerId);
  const [playerRows, chatRows] = await Promise.all([
    playerIds.length > 0
      ? db.select().from(players).where(inArray(players.id, playerIds))
      : Promise.resolve([]),
    db
      .select({
        id: chatMessages.id,
        body: chatMessages.body,
        createdAt: chatMessages.createdAt,
        userId: chatMessages.userId,
        deletedAt: chatMessages.deletedAt,
        authorEmail: profiles.email,
        authorNickname: profiles.nickname,
        authorAvatar: profiles.avatarUrl,
      })
      .from(chatMessages)
      .leftJoin(profiles, eq(chatMessages.userId, profiles.id))
      .where(eq(chatMessages.matchId, matchId))
      .orderBy(desc(chatMessages.createdAt))
      .limit(100),
  ]);
  const playerById = new Map(playerRows.map((p) => [p.id, p]));
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  const home = match.homeTeamId ? teamById.get(match.homeTeamId) : null;
  const away = match.awayTeamId ? teamById.get(match.awayTeamId) : null;

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/calendario">
          <ArrowLeft />
          Volver al calendario
        </Link>
      </Button>
      <PageHeader
        eyebrow={match.stage.toUpperCase()}
        title={`${home?.name ?? "—"} vs ${away?.name ?? "—"}`}
        description={`${new Date(match.scheduledAt).toLocaleString("es-ES")}${match.venue ? ` · ${match.venue}` : ""}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Marcador</CardTitle>
          <CardDescription>
            {match.status === "finished"
              ? "Finalizado"
              : match.status === "live"
                ? "En juego"
                : "Aún no jugado"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-6 py-4">
            <TeamCard team={home} />
            <div className="text-center">
              {match.homeScore != null && match.awayScore != null ? (
                <span className="font-display text-5xl tabular-nums">
                  {match.homeScore}{" "}
                  <span className="text-[var(--color-muted-foreground)]">·</span>{" "}
                  {match.awayScore}
                </span>
              ) : (
                <span className="font-display text-3xl text-[var(--color-muted-foreground)]">
                  vs
                </span>
              )}
              {match.wentToPens ? (
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Pen.: {match.homeScorePen ?? 0} – {match.awayScorePen ?? 0}
                </p>
              ) : null}
            </div>
            <TeamCard team={away} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comentarios del partido</CardTitle>
          <CardDescription>
            Hilo específico de este partido. El admin puede eliminar mensajes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChatThread
            scope="match"
            matchId={matchId}
            currentUserId={me.id}
            isAdmin={me.role === "admin"}
            messages={chatRows.reverse().map((m) => ({
              id: m.id,
              body: m.body,
              createdAt: m.createdAt.toISOString(),
              userId: m.userId,
              deletedAt: m.deletedAt ? m.deletedAt.toISOString() : null,
              author: {
                email: m.authorEmail ?? "",
                nickname: m.authorNickname,
                avatarUrl: m.authorAvatar,
              },
            }))}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Goleadores</CardTitle>
        </CardHeader>
        <CardContent>
          {scorerRows.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Sin goles registrados.
            </p>
          ) : (
            <ul className="space-y-2">
              {scorerRows.map((s) => {
                const p = playerById.get(s.playerId);
                const team = teamById.get(s.teamId);
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{team?.code ?? "?"}</Badge>
                      <span className="font-medium">{p?.name ?? "Jugador"}</span>
                      {s.isFirstGoal ? (
                        <Badge variant="success" className="text-[0.65rem]">
                          1er gol
                        </Badge>
                      ) : null}
                      {s.isOwnGoal ? (
                        <Badge variant="danger" className="text-[0.65rem]">
                          En propia
                        </Badge>
                      ) : null}
                      {s.isPenalty ? (
                        <Badge variant="warning" className="text-[0.65rem]">
                          Pen.
                        </Badge>
                      ) : null}
                    </div>
                    {s.minute != null ? (
                      <span className="text-sm tabular-nums text-[var(--color-muted-foreground)]">
                        {s.minute}&apos;
                      </span>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TeamCard({
  team,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
}) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <span className="grid size-16 place-items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        {team?.flagUrl ? (
          <Image src={team.flagUrl} alt={team.code} width={64} height={64} />
        ) : (
          <span className="text-xs text-[var(--color-muted-foreground)]">{team?.code ?? "?"}</span>
        )}
      </span>
      <p className="font-display text-xl">{team?.name ?? "—"}</p>
    </div>
  );
}
