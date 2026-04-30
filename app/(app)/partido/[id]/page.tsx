import Link from "next/link";
import { TeamFlag } from "@/components/brand/team-flag";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  chatMessages,
  matchScorers,
  matches,
  players,
  predMatchResult,
  predMatchScorer,
  profiles,
  teams,
} from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatThread } from "@/app/(app)/chat/chat-thread";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime, initials } from "@/lib/utils";
import { formatRemaining } from "@/lib/deadlines";
import { Edit3 } from "lucide-react";

const STAGE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

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
  const [allTeams, scorerRows, myResultRows, myScorerRows] = await Promise.all([
    teamIds.length > 0
      ? db.select().from(teams).where(inArray(teams.id, teamIds))
      : Promise.resolve([]),
    db.select().from(matchScorers).where(eq(matchScorers.matchId, matchId)),
    db
      .select()
      .from(predMatchResult)
      .where(
        and(
          eq(predMatchResult.userId, me.id),
          eq(predMatchResult.matchId, matchId),
        ),
      )
      .limit(1),
    db
      .select()
      .from(predMatchScorer)
      .where(
        and(
          eq(predMatchScorer.userId, me.id),
          eq(predMatchScorer.matchId, matchId),
        ),
      )
      .limit(1),
  ]);
  const myResult = myResultRows[0] ?? null;
  const myScorer = myScorerRows[0] ?? null;

  // Predictions become public from kickoff (per visibility rules).
  const predsPublic = new Date(match.scheduledAt) <= new Date();

  const playerIds = scorerRows.map((s) => s.playerId);
  const [playerRows, chatRows, resultPreds, scorerPreds] = await Promise.all([
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
    predsPublic
      ? db
          .select({
            userId: predMatchResult.userId,
            homeScore: predMatchResult.homeScore,
            awayScore: predMatchResult.awayScore,
            willGoToPens: predMatchResult.willGoToPens,
            winnerTeamId: predMatchResult.winnerTeamId,
            authorEmail: profiles.email,
            authorNickname: profiles.nickname,
            authorAvatar: profiles.avatarUrl,
          })
          .from(predMatchResult)
          .leftJoin(profiles, eq(predMatchResult.userId, profiles.id))
          .where(eq(predMatchResult.matchId, matchId))
      : Promise.resolve([]),
    predsPublic
      ? db
          .select({
            userId: predMatchScorer.userId,
            playerId: predMatchScorer.playerId,
          })
          .from(predMatchScorer)
          .where(eq(predMatchScorer.matchId, matchId))
      : Promise.resolve([]),
  ]);

  // Player rows for the goalscorer predictions (mine + everyone's once revealed)
  const predScorerPlayerIds = (scorerPreds as { playerId: number }[]).map((p) => p.playerId);
  const myScorerIds = myScorer ? [myScorer.playerId] : [];
  const allRelevantPlayerIds = Array.from(
    new Set([...playerIds, ...predScorerPlayerIds, ...myScorerIds]),
  );
  const allPlayerRows =
    allRelevantPlayerIds.length > 0
      ? await db.select().from(players).where(inArray(players.id, allRelevantPlayerIds))
      : [];
  const playerById = new Map(allPlayerRows.map((p) => [p.id, p]));
  // Keep a backward-compat reference for the goleadores section using only the
  // scorer player rows so the rest of the page works unchanged.
  void playerRows;
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  const home = match.homeTeamId ? teamById.get(match.homeTeamId) : null;
  const away = match.awayTeamId ? teamById.get(match.awayTeamId) : null;

  const sortedScorers = [...scorerRows].sort(
    (a, b) => (a.minute ?? 999) - (b.minute ?? 999),
  );

  const status =
    match.status === "finished" ? "FINAL" : match.status === "live" ? "EN VIVO" : "PROGRAMADO";

  // Combine result + scorer predictions per user
  type Combined = {
    userId: string;
    nickname: string | null;
    email: string;
    avatarUrl: string | null;
    homeScore: number | null;
    awayScore: number | null;
    willGoToPens: boolean;
    winnerTeamId: number | null;
    scorerPlayerId: number | null;
  };
  const byUser = new Map<string, Combined>();
  for (const r of resultPreds) {
    byUser.set(r.userId, {
      userId: r.userId,
      nickname: r.authorNickname,
      email: r.authorEmail ?? "",
      avatarUrl: r.authorAvatar,
      homeScore: r.homeScore,
      awayScore: r.awayScore,
      willGoToPens: r.willGoToPens,
      winnerTeamId: r.winnerTeamId ?? null,
      scorerPlayerId: null,
    });
  }
  for (const s of scorerPreds) {
    const existing = byUser.get(s.userId);
    if (existing) {
      existing.scorerPlayerId = s.playerId;
    } else {
      byUser.set(s.userId, {
        userId: s.userId,
        nickname: null,
        email: "",
        avatarUrl: null,
        homeScore: null,
        awayScore: null,
        willGoToPens: false,
        winnerTeamId: null,
        scorerPlayerId: s.playerId,
      });
    }
  }
  // Backfill missing identities for scorer-only rows
  if (scorerPreds.length > 0) {
    const missingIds = scorerPreds
      .map((s) => s.userId)
      .filter((id) => byUser.get(id)?.email === "");
    if (missingIds.length > 0) {
      const fill = await db
        .select()
        .from(profiles)
        .where(inArray(profiles.id, missingIds));
      for (const p of fill) {
        const existing = byUser.get(p.id);
        if (existing) {
          existing.email = p.email;
          existing.nickname = p.nickname;
          existing.avatarUrl = p.avatarUrl;
        }
      }
    }
  }
  const allCombined = Array.from(byUser.values()).sort((a, b) => {
    const an = (a.nickname || a.email).toLowerCase();
    const bn = (b.nickname || b.email).toLowerCase();
    return an.localeCompare(bn);
  });

  return (
    <div className="space-y-8">
      <RealtimeRefresher
        channelKey={`partido:${matchId}`}
        subscriptions={[
          { table: "matches", filter: `id=eq.${matchId}` },
          { table: "match_scorers", filter: `match_id=eq.${matchId}` },
        ]}
      />
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/calendario">
          <ArrowLeft />
          Volver al calendario
        </Link>
      </Button>

      {/* Hero scoreboard */}
      <section className="relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="spotlight absolute inset-0" aria-hidden />
        <div className="pitch-grid absolute inset-0 opacity-25" aria-hidden />

        <div className="relative space-y-6 p-6 sm:p-10">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--color-arena)]" />
              <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                {STAGE_LABEL[match.stage]} · {match.code}
              </span>
            </div>
            {match.status === "live" ? (
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-arena)]/60 bg-[color-mix(in_oklch,var(--color-arena)_14%,transparent)] px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-arena)] opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--color-arena)]" />
                </span>
                En vivo
              </span>
            ) : (
              <Badge variant={match.status === "finished" ? "success" : "outline"}>
                {status}
              </Badge>
            )}
          </header>

          <div className="grid items-center gap-6 sm:grid-cols-[1fr_auto_1fr]">
            <TeamHero team={home} side="home" winner={match.winnerTeamId === home?.id} />
            <div className="flex flex-col items-center gap-2 text-center">
              {match.homeScore != null && match.awayScore != null ? (
                <span className="font-display tabular text-7xl leading-none tracking-tighter sm:text-9xl glow-arena">
                  {match.homeScore}
                  <span className="mx-2 text-[var(--color-muted-foreground)] opacity-60">·</span>
                  {match.awayScore}
                </span>
              ) : (
                <KickoffCountdown scheduledAt={match.scheduledAt} />
              )}
              {match.wentToPens ? (
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  Pen. {match.homeScorePen ?? 0} — {match.awayScorePen ?? 0}
                </p>
              ) : null}
            </div>
            <TeamHero team={away} side="away" winner={match.winnerTeamId === away?.id} />
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--color-border)] pt-4 font-editorial text-sm italic text-[var(--color-muted-foreground)]">
            <span>{formatDateTime(match.scheduledAt)}</span>
            {match.venue ? <span className="truncate">{match.venue}</span> : null}
          </footer>
        </div>
      </section>

      {/* My pick */}
      <MyPickPanel
        match={match}
        myResult={myResult}
        myScorerPlayer={myScorer ? playerById.get(myScorer.playerId) ?? null : null}
        actualScorers={sortedScorers}
        teamById={teamById}
      />

      {/* Scorers timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Goleadores</CardTitle>
          <CardDescription>
            En orden cronológico. La marca en rojo arena indica el primer gol del partido.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sortedScorers.length === 0 ? (
            <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
              Sin goles registrados.
            </p>
          ) : (
            <ol className="relative space-y-3 border-l-2 border-dashed border-[var(--color-border)] pl-6">
              {sortedScorers.map((s) => {
                const p = playerById.get(s.playerId);
                const team = teamById.get(s.teamId);
                return (
                  <li key={s.id} className="relative">
                    <span
                      className={`absolute -left-[1.95rem] top-1 grid size-4 place-items-center rounded-full border-2 ${
                        s.isFirstGoal
                          ? "border-[var(--color-arena)] bg-[var(--color-arena)]"
                          : "border-[var(--color-border-strong)] bg-[var(--color-surface)]"
                      }`}
                    >
                      {s.isFirstGoal ? (
                        <span className="size-1 rounded-full bg-white" />
                      ) : null}
                    </span>
                    <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{team?.code ?? "?"}</Badge>
                        <span className="font-display text-base tracking-tight">
                          {p?.name ?? "Jugador"}
                        </span>
                        {s.isFirstGoal ? (
                          <Badge variant="default" className="text-[0.55rem]">
                            1er gol
                          </Badge>
                        ) : null}
                        {s.isOwnGoal ? (
                          <Badge variant="danger" className="text-[0.55rem]">
                            En propia
                          </Badge>
                        ) : null}
                        {s.isPenalty ? (
                          <Badge variant="warning" className="text-[0.55rem]">
                            Pen.
                          </Badge>
                        ) : null}
                      </div>
                      {s.minute != null ? (
                        <span className="font-display tabular text-2xl text-[var(--color-muted-foreground)]">
                          {s.minute}
                          <span className="text-sm">′</span>
                        </span>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Predictions reveal */}
      {predsPublic ? (
        <Card>
          <CardHeader>
            <CardTitle>Predicciones de la peña</CardTitle>
            <CardDescription>
              Públicas desde el pitido inicial. {allCombined.length}{" "}
              {allCombined.length === 1 ? "participante apostó" : "participantes apostaron"} por
              este partido.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allCombined.length === 0 ? (
              <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                Nadie predijo este partido a tiempo. ¡Os habéis dejado puntos!
              </p>
            ) : (
              <div className="overflow-hidden rounded-lg border border-[var(--color-border)]">
                <div className="hidden grid-cols-[1fr_110px_1fr] items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)] sm:grid">
                  <span>Participante</span>
                  <span className="text-center">Resultado</span>
                  <span>Goleador</span>
                </div>
                <ul>
                  {allCombined.map((c) => {
                    const display = c.nickname || c.email.split("@")[0];
                    const player = c.scorerPlayerId ? playerById.get(c.scorerPlayerId) : null;
                    const playerScored =
                      player &&
                      sortedScorers.some((s) => s.playerId === player.id);
                    const exactScore =
                      match.homeScore != null &&
                      match.awayScore != null &&
                      c.homeScore === match.homeScore &&
                      c.awayScore === match.awayScore;
                    return (
                      <li
                        key={c.userId}
                        className={`flex flex-col gap-1.5 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 sm:grid sm:grid-cols-[1fr_110px_1fr] sm:items-center sm:gap-2 sm:py-2.5 ${
                          c.userId === me.id
                            ? "bg-[color-mix(in_oklch,var(--color-arena)_5%,transparent)]"
                            : ""
                        }`}
                      >
                        <span className="flex items-center gap-2 truncate">
                          <Avatar className="size-7 border border-[var(--color-border)]">
                            {c.avatarUrl ? <AvatarImage src={c.avatarUrl} alt="" /> : null}
                            <AvatarFallback className="text-[0.6rem]">
                              {initials(display)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate text-sm font-medium">
                            {display}
                            {c.userId === me.id ? (
                              <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-[0.3em] text-[var(--color-arena)]">
                                Tú
                              </span>
                            ) : null}
                          </span>
                        </span>
                        <span
                          className={`flex items-baseline gap-2 font-display tabular text-xl sm:justify-center ${
                            exactScore ? "text-[var(--color-success)] glow-pitch" : ""
                          }`}
                        >
                          <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] sm:hidden">
                            Resultado
                          </span>
                          {c.homeScore != null && c.awayScore != null ? (
                            <>
                              {c.homeScore}
                              <span className="mx-1 opacity-60">·</span>
                              {c.awayScore}
                            </>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">—</span>
                          )}
                          {c.willGoToPens ? (
                            <span className="font-mono text-[0.55rem] uppercase text-[var(--color-muted-foreground)]">
                              pen
                            </span>
                          ) : null}
                        </span>
                        <span className="flex items-center gap-2 truncate text-sm">
                          <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] sm:hidden">
                            Goleador
                          </span>
                          {player ? (
                            <>
                              <span
                                className={`size-1.5 rounded-full ${
                                  playerScored
                                    ? "bg-[var(--color-success)]"
                                    : "bg-[var(--color-muted-foreground)]"
                                }`}
                              />
                              <span className="truncate">{player.name}</span>
                            </>
                          ) : (
                            <span className="text-[var(--color-muted-foreground)]">—</span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ) : null}

      {/* Match thread */}
      <Card>
        <CardHeader>
          <CardTitle>Hilo del partido</CardTitle>
          <CardDescription>
            Comentario en directo. El admin puede borrar mensajes que se pasen de raya.
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
    </div>
  );
}

function MyPickPanel({
  match,
  myResult,
  myScorerPlayer,
  actualScorers,
  teamById,
}: {
  match: typeof matches.$inferSelect;
  myResult: typeof predMatchResult.$inferSelect | null;
  myScorerPlayer: typeof players.$inferSelect | null;
  actualScorers: (typeof matchScorers.$inferSelect)[];
  teamById: Map<number, typeof teams.$inferSelect>;
}) {
  const open = new Date(match.scheduledAt).getTime() > Date.now();
  const finished = match.status === "finished";
  const hasPick = myResult != null || myScorerPlayer != null;
  const exactScore =
    finished &&
    myResult != null &&
    match.homeScore != null &&
    match.awayScore != null &&
    myResult.homeScore === match.homeScore &&
    myResult.awayScore === match.awayScore;
  const winnerCorrect =
    finished &&
    myResult != null &&
    match.homeScore != null &&
    match.awayScore != null &&
    Math.sign(myResult.homeScore - myResult.awayScore) ===
      Math.sign(match.homeScore - match.awayScore);
  const scorerHit =
    finished &&
    myScorerPlayer != null &&
    actualScorers.some((s) => s.playerId === myScorerPlayer.id);
  const firstGoalHit =
    finished &&
    myScorerPlayer != null &&
    actualScorers.find((s) => s.isFirstGoal)?.playerId === myScorerPlayer.id;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>Tu pick</CardTitle>
          <CardDescription>
            {hasPick
              ? open
                ? "Editable hasta el cierre de la jornada."
                : finished
                  ? "Resultado y aciertos para este partido."
                  : "Tus picks ya están bloqueados."
              : open
                ? "Aún no has predicho este partido."
                : "Te has dejado puntos en este partido."}
          </CardDescription>
        </div>
        {open && match.matchdayId != null ? (
          <Button asChild variant="outline" size="sm">
            <Link href={`/predicciones/jornada/${match.matchdayId}`}>
              <Edit3 className="size-3.5" />
              {hasPick ? "Editar" : "Predecir"}
            </Link>
          </Button>
        ) : null}
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          <PickRow
            label="Marcador"
            primary={
              myResult != null
                ? `${myResult.homeScore} · ${myResult.awayScore}`
                : null
            }
            extra={
              myResult?.willGoToPens ? "predigo penaltis" : null
            }
            badges={
              finished
                ? [
                    exactScore
                      ? { variant: "success" as const, text: "Exacto +5" }
                      : winnerCorrect
                        ? { variant: "success" as const, text: "Ganador +2" }
                        : { variant: "outline" as const, text: "Falló" },
                    ...(myResult?.willGoToPens && match.wentToPens
                      ? [{ variant: "success" as const, text: "Penaltis +2" }]
                      : []),
                  ]
                : []
            }
            winnerHint={
              finished &&
              myResult?.winnerTeamId != null &&
              match.winnerTeamId != null
                ? myResult.winnerTeamId === match.winnerTeamId
                  ? `Clasificado: ${teamById.get(myResult.winnerTeamId)?.name ?? "—"} ✓ +3`
                  : `Clasificado: ${teamById.get(myResult.winnerTeamId)?.name ?? "—"} ✗`
                : myResult?.winnerTeamId != null
                  ? `Clasificado: ${teamById.get(myResult.winnerTeamId)?.name ?? "—"}`
                  : null
            }
          />
          <PickRow
            label="Goleador"
            primary={myScorerPlayer?.name ?? null}
            extra={
              myScorerPlayer
                ? `#${myScorerPlayer.jerseyNumber ?? "—"} · ${
                    teamById.get(myScorerPlayer.teamId)?.code ?? ""
                  }`
                : null
            }
            badges={
              finished && myScorerPlayer
                ? [
                    scorerHit
                      ? { variant: "success" as const, text: "Marcó +4" }
                      : { variant: "outline" as const, text: "No marcó" },
                    ...(firstGoalHit
                      ? [{ variant: "success" as const, text: "Primer gol +2" }]
                      : []),
                  ]
                : []
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}

function PickRow({
  label,
  primary,
  extra,
  badges,
  winnerHint,
}: {
  label: string;
  primary: string | null;
  extra?: string | null;
  badges?: { variant: "success" | "outline"; text: string }[];
  winnerHint?: string | null;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-4">
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`font-display tabular text-3xl tracking-tight ${
          primary ? "" : "text-[var(--color-muted-foreground)]"
        }`}
      >
        {primary ?? "Sin pick"}
      </p>
      {extra ? (
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
          {extra}
        </p>
      ) : null}
      {winnerHint ? (
        <p className="text-[0.7rem] text-[var(--color-muted-foreground)]">{winnerHint}</p>
      ) : null}
      {badges && badges.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {badges.map((b, i) => (
            <Badge key={i} variant={b.variant} className="text-[0.55rem]">
              {b.text}
            </Badge>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function KickoffCountdown({ scheduledAt }: { scheduledAt: Date | string }) {
  const ms = new Date(scheduledAt).getTime() - Date.now();
  if (ms <= 0) {
    return (
      <span className="font-display text-6xl text-[var(--color-muted-foreground)]">
        vs
      </span>
    );
  }
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        Empieza en
      </span>
      <span className="font-display tabular text-5xl leading-none tracking-tighter text-[var(--color-arena)] glow-arena sm:text-7xl">
        {formatRemaining(ms)}
      </span>
    </div>
  );
}

function TeamHero({
  team,
  side,
  winner,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
  side: "home" | "away";
  winner: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 text-center ${
        side === "home" ? "sm:items-end sm:text-right" : "sm:items-start sm:text-left"
      }`}
    >
      <TeamFlag
        code={team?.code}
        size={80}
        className={
          winner
            ? "ring-2 ring-[var(--color-arena)] shadow-[var(--shadow-arena)]"
            : "ring-1 ring-[var(--color-border-strong)]"
        }
      />
      <div>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {team?.code ?? "—"}
        </p>
        <p
          className={`font-display text-3xl tracking-tight sm:text-4xl ${
            winner ? "text-[var(--color-arena)]" : ""
          }`}
        >
          {team?.name ?? "TBD"}
        </p>
      </div>
    </div>
  );
}
