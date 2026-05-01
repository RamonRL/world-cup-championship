import Link from "next/link";
import { TeamFlag } from "@/components/brand/team-flag";
import { ArrowRight, ArrowUpRight, CheckCircle2, Flame, Sparkles } from "lucide-react";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchScorers,
  matchdays,
  matches,
  players,
  pointsLedger,
  predGroupRanking,
  predMatchScorer,
  predSpecial,
  predTournamentTopScorer,
  profiles,
  specialPredictions,
  teams,
} from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RealtimeRefresher } from "@/components/realtime/realtime-refresher";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId, inLeagueFilter } from "@/lib/leagues";
import { formatDateTime } from "@/lib/utils";
import { loadActivityFeed } from "@/lib/activity-feed";

const KICKOFF = process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z";

const MARQUEE_TOKENS = [
  "MUNDIAL FIFA 26",
  "CANADÁ",
  "MÉXICO",
  "USA",
  "11 JUN — 19 JUL",
  "48 SELECCIONES",
  "104 PARTIDOS",
];

export default async function DashboardPage() {
  const me = await requireUser();
  const leagueId = await currentLeagueId(me);
  const kickoff = new Date(KICKOFF);
  const days = Math.max(0, Math.ceil((kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Stats
  const [myPointsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, me.id));
  const myPoints = myPointsRow?.total ?? 0;

  // Participantes de la liga visible + admins (globales).
  const leagueFilter = inLeagueFilter(leagueId);
  const allUsers = leagueFilter
    ? await db.select().from(profiles).where(leagueFilter)
    : await db.select().from(profiles);
  const allLedger = await db.select().from(pointsLedger);
  const stats = new Map<
    string,
    {
      totalPoints: number;
      exactScoresCount: number;
      knockoutPoints: number;
      championCorrect: boolean;
    }
  >();
  for (const u of allUsers) {
    stats.set(u.id, {
      totalPoints: 0,
      exactScoresCount: 0,
      knockoutPoints: 0,
      championCorrect: false,
    });
  }
  for (const e of allLedger) {
    const s = stats.get(e.userId);
    if (!s) continue;
    s.totalPoints += e.points;
    if (e.source === "match_exact_score" || e.source === "knockout_score_90") {
      s.exactScoresCount += 1;
    }
    if (
      e.source === "bracket_slot" ||
      e.source === "knockout_qualifier" ||
      e.source === "knockout_pens_bonus" ||
      e.source === "knockout_score_90"
    ) {
      s.knockoutPoints += e.points;
    }
  }
  const sorted = allUsers
    .map((u) => ({
      user: u,
      ...(stats.get(u.id) ?? {
        totalPoints: 0,
        exactScoresCount: 0,
        knockoutPoints: 0,
        championCorrect: false,
      }),
    }))
    .sort((a, b) =>
      compareForRanking(
        { userId: a.user.id, ...a },
        { userId: b.user.id, ...b },
      ),
    );
  const myPosition =
    sorted.length > 0 && myPoints > 0
      ? sorted.findIndex((r) => r.user.id === me.id) + 1
      : null;

  const upcomingMatchdays = await db
    .select()
    .from(matchdays)
    .where(gt(matchdays.predictionDeadlineAt, new Date()))
    .orderBy(asc(matchdays.predictionDeadlineAt))
    .limit(1);

  const pendingScorerCount = await db
    .select({ c: sql<number>`count(*)::int` })
    .from(matches)
    .leftJoin(
      predMatchScorer,
      and(
        eq(predMatchScorer.matchId, matches.id),
        eq(predMatchScorer.userId, me.id),
      ),
    )
    .where(and(gt(matches.scheduledAt, new Date()), sql`${predMatchScorer.matchId} is null`));
  const pendingScorers = pendingScorerCount[0]?.c ?? 0;

  const [
    groupCount,
    topScorerSet,
    mySpecialsRow,
    totalSpecialsRow,
    recentMatch,
    nextMatch,
    liveMatchRows,
  ] = await Promise.all([
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(predGroupRanking)
      .where(eq(predGroupRanking.userId, me.id)),
    db
      .select()
      .from(predTournamentTopScorer)
      .where(eq(predTournamentTopScorer.userId, me.id))
      .limit(1),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(predSpecial)
      .where(eq(predSpecial.userId, me.id)),
    db.select({ c: sql<number>`count(*)::int` }).from(specialPredictions),
    db
      .select()
      .from(matches)
      .where(eq(matches.status, "finished"))
      .orderBy(desc(matches.scheduledAt))
      .limit(3),
    db
      .select()
      .from(matches)
      .where(gt(matches.scheduledAt, new Date()))
      .orderBy(asc(matches.scheduledAt))
      .limit(1),
    db
      .select()
      .from(matches)
      .where(eq(matches.status, "live"))
      .orderBy(asc(matches.scheduledAt))
      .limit(1),
  ]);
  const liveMatch = liveMatchRows[0] ?? null;

  const teamIds = [...recentMatch, ...nextMatch, ...(liveMatch ? [liveMatch] : [])]
    .flatMap((m) => [m.homeTeamId, m.awayTeamId])
    .filter((x): x is number => x != null);
  const teamRows =
    teamIds.length > 0
      ? await db.select().from(teams).where(sql`id = ANY(${sql.raw(`ARRAY[${teamIds.join(",")}]::int[]`)})`)
      : [];
  const teamById = new Map(teamRows.map((t) => [t.id, t]));
  const next = nextMatch[0];
  const nextHome = next?.homeTeamId ? teamById.get(next.homeTeamId) ?? null : null;
  const nextAway = next?.awayTeamId ? teamById.get(next.awayTeamId) ?? null : null;

  // Live HUD data: the active match's flags, scorers in chronological order.
  const liveHome = liveMatch?.homeTeamId ? teamById.get(liveMatch.homeTeamId) ?? null : null;
  const liveAway = liveMatch?.awayTeamId ? teamById.get(liveMatch.awayTeamId) ?? null : null;
  const liveScorerRows = liveMatch
    ? await db
        .select()
        .from(matchScorers)
        .where(eq(matchScorers.matchId, liveMatch.id))
    : [];
  const activity = await loadActivityFeed(me.id, 8);

  const liveScorerPlayerIds = liveScorerRows.map((s) => s.playerId);
  const livePlayerRows =
    liveScorerPlayerIds.length > 0
      ? await db
          .select()
          .from(players)
          .where(sql`id = ANY(${sql.raw(`ARRAY[${liveScorerPlayerIds.join(",")}]::int[]`)})`)
      : [];
  const livePlayerById = new Map(livePlayerRows.map((p) => [p.id, p]));
  const liveMinute =
    liveMatch != null
      ? Math.max(
          1,
          Math.min(
            120,
            Math.floor((Date.now() - new Date(liveMatch.scheduledAt).getTime()) / 60000),
          ),
        )
      : null;

  const greeting = me.nickname || me.email.split("@")[0];
  const podium = sorted.slice(0, 3);

  // Pre-torneo progress: 3 categories — group rankings, top scorer, specials.
  const groupsDone = (groupCount[0]?.c ?? 0) === 12;
  const topScorerDone = topScorerSet.length > 0;
  const totalSpecials = totalSpecialsRow[0]?.c ?? 0;
  const mySpecials = mySpecialsRow[0]?.c ?? 0;
  const specialsDone = totalSpecials > 0 && mySpecials >= totalSpecials;
  const preTorneoComplete =
    [groupsDone, topScorerDone, specialsDone].filter(Boolean).length;
  const preTorneoTotal = 3;
  const tournamentStarted = kickoff.getTime() <= Date.now();
  const myStats = stats.get(me.id);
  const exactScores = myStats?.exactScoresCount ?? 0;

  return (
    <div className="space-y-10">
      {/* Marquee strip */}
      <div className="-mx-4 overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface)] py-2 lg:-mx-8">
        <div className="marquee flex w-max items-center gap-8 whitespace-nowrap font-display text-xs uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {[...Array(2)].map((_, dup) => (
            <div key={dup} className="flex items-center gap-8 pr-8">
              {MARQUEE_TOKENS.map((t, i) => (
                <span key={`${dup}-${i}`} className="flex items-center gap-8">
                  <span>{t}</span>
                  <span className="size-1 rounded-full bg-[var(--color-arena)]" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Onboarding — solo cuando hay pre-torneo pendiente y el torneo no
          ha empezado. Hace de wayfinder para participantes nuevos: les
          señala dónde ir a hacer su próximo pick. Desaparece al completar
          las 3 categorías. */}
      {!tournamentStarted && preTorneoComplete < preTorneoTotal ? (
        <OnboardingPanel
          groupsDone={groupsDone}
          topScorerDone={topScorerDone}
          specialsDone={specialsDone}
          totalSpecials={totalSpecials}
          mySpecials={mySpecials}
          daysToKickoff={days}
          nickname={me.nickname}
        />
      ) : null}

      {/* Live HUD — appears only when a match is currently in play */}
      {liveMatch ? (
        <Link
          href={`/partido/${liveMatch.id}`}
          className="group relative block overflow-hidden rounded-2xl border-2 border-[var(--color-arena)]/60 bg-[color-mix(in_oklch,var(--color-arena)_8%,var(--color-surface))] shadow-[var(--shadow-arena)] transition-all hover:-translate-y-0.5"
        >
          <RealtimeRefresher
            channelKey={`live-hud:${liveMatch.id}`}
            subscriptions={[
              { table: "matches", filter: `id=eq.${liveMatch.id}` },
              { table: "match_scorers", filter: `match_id=eq.${liveMatch.id}` },
            ]}
          />
          <div className="halftone pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
          <div className="relative space-y-4 p-5 sm:p-7">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="relative flex size-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-arena)] opacity-70" />
                  <span className="relative inline-flex size-2 rounded-full bg-[var(--color-arena)]" />
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
                  En vivo · {liveMatch.code}
                </span>
              </div>
              {liveMinute != null ? (
                <span className="font-display tabular text-2xl text-[var(--color-arena)] glow-arena">
                  {liveMinute}
                  <span className="text-base">′</span>
                </span>
              ) : null}
            </div>
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
              <LiveTeam team={liveHome} />
              <span className="font-display tabular text-5xl leading-none tracking-tighter sm:text-7xl">
                {liveMatch.homeScore ?? 0}
                <span className="mx-1 text-[var(--color-muted-foreground)] opacity-60 sm:mx-2">·</span>
                {liveMatch.awayScore ?? 0}
              </span>
              <LiveTeam team={liveAway} align="end" />
            </div>
            {liveScorerRows.length > 0 ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-[var(--color-arena)]/30 pt-3">
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  Goles
                </span>
                {[...liveScorerRows]
                  .sort((a, b) => (a.minute ?? 999) - (b.minute ?? 999))
                  .map((s) => {
                    const p = livePlayerById.get(s.playerId);
                    const t = teamById.get(s.teamId);
                    return (
                      <span
                        key={s.id}
                        className="flex items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-xs"
                      >
                        <Badge variant="outline" className="text-[0.55rem]">
                          {t?.code ?? "?"}
                        </Badge>
                        <span className="font-medium">{p?.name ?? "Jugador"}</span>
                        {s.minute != null ? (
                          <span className="font-mono text-[0.6rem] text-[var(--color-muted-foreground)]">
                            {s.minute}′
                          </span>
                        ) : null}
                      </span>
                    );
                  })}
              </div>
            ) : null}
          </div>
        </Link>
      ) : null}

      {/* Hero */}
      <section className="rise-in relative overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="spotlight absolute inset-0" aria-hidden />
        <div className="pitch-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col justify-between gap-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="h-px w-8 bg-[var(--color-arena)]" />
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  Hola · {greeting}
                </span>
              </div>
              <p className="font-editorial text-lg italic leading-snug text-[var(--color-muted-foreground)]">
                Faltan
              </p>
            </div>
            <div className="-my-2 flex items-end gap-4">
              <span className="font-display glow-arena text-[8rem] leading-[0.85] tracking-tighter sm:text-[11rem]">
                {days.toString().padStart(2, "0")}
              </span>
              <div className="mb-4 flex flex-col gap-1">
                <span className="font-display text-3xl tracking-tight">
                  DÍAS
                </span>
                <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  AL KICKOFF
                </span>
              </div>
            </div>
            <p className="font-editorial text-base italic text-[var(--color-muted-foreground)] sm:text-lg">
              {formatDateTime(kickoff, {
                weekday: "long",
                day: "2-digit",
                month: "long",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
            {!tournamentStarted ? (
              <div className="flex items-center gap-3 border-t border-dashed border-[var(--color-border)] pt-4">
                <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  Pre-torneo
                </p>
                <div className="flex items-center gap-1.5">
                  <ProgressDot done={groupsDone} label="Grupos" />
                  <ProgressDot done={topScorerDone} label="Bota" />
                  <ProgressDot done={specialsDone} label="Especiales" />
                </div>
                <span className="ml-auto font-display tabular text-base text-[var(--color-arena)] glow-arena">
                  {preTorneoComplete}/{preTorneoTotal}
                </span>
              </div>
            ) : null}
          </div>

          {/* Right column — next match & up next deadline */}
          <div className="flex flex-col gap-4">
            {next ? (
              <Link
                href={`/partido/${next.id}`}
                className="group block overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] transition-colors hover:border-[var(--color-arena)]/60"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-3)]/40 px-4 py-2">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                    Próximo partido · {next.code}
                  </span>
                  <ArrowUpRight className="size-3.5 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                </div>
                <div className="space-y-4 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <TeamCell team={nextHome} align="start" />
                    <span className="font-display text-2xl text-[var(--color-muted-foreground)]">
                      vs
                    </span>
                    <TeamCell team={nextAway} align="end" />
                  </div>
                  <div className="flex items-center justify-between border-t border-dashed border-[var(--color-border)] pt-3 text-xs text-[var(--color-muted-foreground)]">
                    <span>
                      {formatDateTime(next.scheduledAt, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {next.venue ? (
                      <span className="truncate">{next.venue.split("·")[0].trim()}</span>
                    ) : null}
                  </div>
                </div>
              </Link>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface-2)] p-6 text-center text-sm text-[var(--color-muted-foreground)]">
                Sin partidos próximos.
              </div>
            )}

            <Link
              href={
                upcomingMatchdays[0]
                  ? `/predicciones/jornada/${upcomingMatchdays[0].id}`
                  : "/predicciones"
              }
              className="group flex items-center justify-between rounded-xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] p-4 transition hover:border-[var(--color-arena)]"
            >
              <div className="flex items-center gap-3">
                <Flame className="size-5 text-[var(--color-arena)]" />
                <div>
                  <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                    Próximo cierre
                  </p>
                  <p className="font-display text-xl tracking-tight">
                    {upcomingMatchdays[0]?.name ?? "Sin jornada activa"}
                  </p>
                  {upcomingMatchdays[0] ? (
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDateTime(upcomingMatchdays[0].predictionDeadlineAt, {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  ) : null}
                </div>
              </div>
              <ArrowRight className="size-4 text-[var(--color-arena)] transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Scoreboard stats */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat
          label="TU POSICIÓN"
          value={myPosition != null ? `${myPosition.toString().padStart(2, "0")}` : "--"}
          prefix={myPosition != null ? "#" : null}
          hint={
            myPosition != null
              ? `de ${sorted.length}`
              : sorted.length > 1
                ? `${sorted.length} jugadores · sin puntos aún`
                : "Esperando primer resultado"
          }
          accent
          href={`/ranking/${me.id}`}
        />
        <Stat label="PUNTOS" value={myPoints.toString()} hint="acumulados" />
        {tournamentStarted ? (
          <>
            <Stat
              label="GOLEADORES PEND."
              value={pendingScorers.toString()}
              hint="próximos sin pick"
            />
            <Stat
              label="EXACTOS"
              value={exactScores.toString()}
              hint="marcadores clavados"
            />
          </>
        ) : (
          <>
            <Stat
              label="PRE-TORNEO"
              value={`${preTorneoComplete}/${preTorneoTotal}`}
              hint={
                preTorneoComplete === preTorneoTotal
                  ? "todo listo · puedes editar hasta el kickoff"
                  : "categorías por cerrar"
              }
            />
            <Stat
              label="ESPECIALES"
              value={`${mySpecials}/${totalSpecials || "—"}`}
              hint={
                totalSpecials === 0
                  ? "aún no publicadas"
                  : mySpecials === totalSpecials
                    ? "todas respondidas"
                    : "preguntas sin responder"
              }
            />
          </>
        )}
      </section>

      {/* Activity feed — appears once the user has earned points */}
      {activity.length > 0 ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <header className="flex items-center justify-between gap-3 pb-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-6 bg-[var(--color-arena)]" />
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Últimos puntos · tu ledger
              </p>
            </div>
            <p className="font-display text-xl tracking-tight">+{myPoints}</p>
          </header>
          <ul className="grid gap-2 sm:grid-cols-2">
            {activity.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{a.label}</p>
                  {a.detail ? (
                    <p className="truncate font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                      {a.detail}
                    </p>
                  ) : null}
                </div>
                <span className="font-display tabular text-2xl text-[var(--color-arena)] glow-arena">
                  +{a.points}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Body — checklist + recent + podium. La tarjeta "Pre-torneo"
          sólo aparece cuando ya está cerrado o el torneo arrancó; antes,
          el OnboardingPanel arriba ya hace ese trabajo y duplicar
          redundaría. */}
      {(() => {
        const showPreTorneoCard =
          tournamentStarted || preTorneoComplete === preTorneoTotal;
        return (
          <section
            className={`grid gap-4 ${
              showPreTorneoCard
                ? "lg:grid-cols-[1.2fr_1fr_1fr]"
                : "lg:grid-cols-2"
            }`}
          >
            {showPreTorneoCard ? (
              <Card>
                <CardHeader>
                  <CardTitle>Pre-torneo</CardTitle>
                  <CardDescription>
                    {tournamentStarted
                      ? "Tus picks de antes del kickoff."
                      : "Listo para el inicio."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <PreCheck
                    done={groupsDone}
                    label="Posiciones de grupo"
                    hint={`${groupCount[0]?.c ?? 0}/12 grupos`}
                    href="/predicciones/grupos"
                  />
                  <PreCheck
                    done={topScorerDone}
                    label="Bota de Oro"
                    hint="Tu candidato al máximo goleador"
                    href="/predicciones/goleador-torneo"
                  />
                  <PreCheck
                    done={specialsDone}
                    label="Predicciones especiales"
                    hint={
                      totalSpecials > 0
                        ? `${mySpecials}/${totalSpecials} respondidas`
                        : "Balón / Guante / Anfitrión / África…"
                    }
                    href="/predicciones/especiales"
                  />
                </CardContent>
              </Card>
            ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Resultados recientes</CardTitle>
            <CardDescription>Lo último de la cancha.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMatch.length === 0 ? (
              <div className="space-y-3">
                <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                  Aún no hay partidos finalizados. Mientras tanto:
                </p>
                <Link
                  href="/calendario"
                  className="group flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm transition hover:border-[var(--color-arena)]/40"
                >
                  <span>
                    <p className="font-medium">Ver el calendario completo</p>
                    <p className="text-[0.7rem] text-[var(--color-muted-foreground)]">
                      104 partidos por jornada
                    </p>
                  </span>
                  <ArrowRight className="size-4 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              recentMatch.map((m) => {
                const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                return (
                  <Link
                    key={m.id}
                    href={`/partido/${m.id}`}
                    className="group flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5 text-sm transition hover:border-[var(--color-arena)]/40"
                  >
                    <span className="flex items-center gap-2 truncate">
                      <TeamFlag code={home?.code} size={24} />
                      <span className="truncate">{home?.name ?? "—"}</span>
                    </span>
                    <span className="font-display tabular text-xl">
                      {m.homeScore} <span className="opacity-50">·</span> {m.awayScore}
                    </span>
                    <span className="flex items-center gap-2 truncate text-right">
                      <span className="truncate">{away?.name ?? "—"}</span>
                      <TeamFlag code={away?.code} size={24} />
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cabeza de tabla</CardTitle>
            <CardDescription>El podio en directo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {podium.length === 0 || podium[0].totalPoints === 0 ? (
              <div className="space-y-3">
                <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                  {sorted.length > 1
                    ? `${sorted.length} jugadores empatados a 0. Que empiece el torneo.`
                    : "Esperando más participantes."}
                </p>
                <Link
                  href="/ranking"
                  className="group flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 text-sm transition hover:border-[var(--color-arena)]/40"
                >
                  <span>
                    <p className="font-medium">Ver el ranking completo</p>
                    <p className="text-[0.7rem] text-[var(--color-muted-foreground)]">
                      Todos los participantes inscritos
                    </p>
                  </span>
                  <ArrowRight className="size-4 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            ) : (
              podium.map((p, i) => {
                const display = p.user.nickname || p.user.email.split("@")[0];
                const isMe = p.user.id === me.id;
                return (
                  <div
                    key={p.user.id}
                    className={`flex items-center gap-3 rounded-md border border-[var(--color-border)] p-2.5 ${
                      isMe ? "bg-[var(--color-arena)]/10 border-[var(--color-arena)]/40" : "bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <span className="font-display text-2xl tabular text-[var(--color-arena)]">
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate text-sm font-medium">{display}</span>
                    <span className="font-display tabular text-xl">{p.totalPoints}</span>
                  </div>
                );
              })
            )}
            <Link
              href="/ranking"
              className="mt-2 flex items-center justify-end gap-1 text-xs uppercase tracking-[0.2em] text-[var(--color-muted-foreground)] hover:text-[var(--color-arena)]"
            >
              Ver ranking <ArrowRight className="size-3.5" />
            </Link>
          </CardContent>
        </Card>
          </section>
        );
      })()}
    </div>
  );
}

function OnboardingPanel({
  groupsDone,
  topScorerDone,
  specialsDone,
  totalSpecials,
  mySpecials,
  daysToKickoff,
  nickname,
}: {
  groupsDone: boolean;
  topScorerDone: boolean;
  specialsDone: boolean;
  totalSpecials: number;
  mySpecials: number;
  daysToKickoff: number;
  nickname: string | null;
}) {
  const completed = [groupsDone, topScorerDone, specialsDone].filter(Boolean).length;
  const isFresh = completed === 0;
  // Pick the next undone category in canonical order.
  const next = !groupsDone
    ? { href: "/predicciones/grupos", label: "Posiciones de grupo" }
    : !topScorerDone
      ? { href: "/predicciones/goleador-torneo", label: "Bota de Oro" }
      : { href: "/predicciones/especiales", label: "Especiales" };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,var(--color-surface))]">
      <div className="halftone pointer-events-none absolute inset-0 opacity-[0.06]" aria-hidden />
      <div className="pitch-grid pointer-events-none absolute inset-0 opacity-20" aria-hidden />
      <div className="relative grid gap-6 p-5 sm:p-7 lg:grid-cols-[1.4fr_auto] lg:items-center">
        <div className="space-y-3">
          <div className="flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
            <Sparkles className="size-3.5" />
            {isFresh ? "Bienvenido al Mundial" : "Continúa donde lo dejaste"}
          </div>
          <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
            {isFresh
              ? `Hola${nickname ? `, ${nickname}` : ""}. Cierra tus 3 picks pre-torneo`
              : `${3 - completed} ${3 - completed === 1 ? "categoría" : "categorías"} sin cerrar`}
          </h2>
          <p className="font-editorial text-sm italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-base">
            {isFresh
              ? "Tres apuestas que decides ahora y se cierran cuando arranque el torneo. El bracket llega después, ronda a ronda. Marcador y goleador se predicen jornada a jornada."
              : `Tienes ${daysToKickoff} ${daysToKickoff === 1 ? "día" : "días"} hasta el kickoff para cerrarlas.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <OnboardingStep n="01" label="Grupos" done={groupsDone} />
            <OnboardingStep n="02" label="Bota" done={topScorerDone} />
            <OnboardingStep
              n="03"
              label={
                totalSpecials > 0
                  ? `Especiales ${mySpecials}/${totalSpecials}`
                  : "Especiales"
              }
              done={specialsDone}
            />
            <span className="ml-1 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              {completed}/3 listo
            </span>
          </div>
        </div>
        <div className="flex flex-col items-stretch gap-2 lg:items-end">
          <Link
            href={next.href}
            className="group inline-flex items-center justify-center gap-2 rounded-md bg-[var(--color-arena)] px-5 py-3 font-display text-base text-white shadow-[var(--shadow-arena)] transition hover:scale-[1.02]"
          >
            {isFresh ? "Empezar por" : "Continuar con"}{" "}
            <span className="font-medium">{next.label}</span>
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/predicciones"
            className="text-center font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] hover:text-[var(--color-arena)]"
          >
            Ver todas las categorías →
          </Link>
        </div>
      </div>
    </section>
  );
}

function OnboardingStep({
  n,
  label,
  done,
}: {
  n: string;
  label: string;
  done: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-md border px-2.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] ${
        done
          ? "border-[var(--color-success)]/40 bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-muted-foreground)]"
      }`}
    >
      <span className="font-display text-xs tracking-tight">{n}</span>
      <span>{label}</span>
      {done ? <CheckCircle2 className="size-3.5" /> : null}
    </span>
  );
}

function Stat({
  label,
  value,
  prefix,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  prefix?: string | null;
  hint?: string;
  accent?: boolean;
  href?: string;
}) {
  const className = `group relative overflow-hidden rounded-xl border ${
    accent
      ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))]"
      : "border-[var(--color-border)] bg-[var(--color-surface)]"
  } p-5 ${
    href
      ? "transition hover:-translate-y-0.5 hover:border-[var(--color-arena)]/70 hover:shadow-[var(--shadow-elev-2)]"
      : ""
  }`;
  const inner = (
    <>
      <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1">
        {prefix ? (
          <span className="font-display text-2xl text-[var(--color-muted-foreground)]">
            {prefix}
          </span>
        ) : null}
        <span
          className={`font-display tabular text-5xl tracking-tight ${
            accent ? "text-[var(--color-arena)] glow-arena" : ""
          }`}
        >
          {value}
        </span>
      </div>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{hint}</p>
      ) : null}
      {href ? (
        <span className="mt-2 flex items-center gap-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-arena)] transition group-hover:translate-x-0.5">
          Ver mis resultados <ArrowRight className="size-3" />
        </span>
      ) : null}
    </>
  );
  return href ? (
    <Link href={href} className={className}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

function ProgressDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      title={`${label}: ${done ? "completo" : "pendiente"}`}
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] ${
        done
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_12%,transparent)] text-[var(--color-arena)]"
          : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]"
      }`}
    >
      <span className={`size-1.5 rounded-full ${done ? "bg-[var(--color-arena)]" : "bg-[var(--color-muted-foreground)]/40"}`} />
      {label}
    </span>
  );
}

function PreCheck({
  done,
  label,
  hint,
  href,
}: {
  done: boolean;
  label: string;
  hint?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-3 transition hover:border-[var(--color-arena)]/40"
    >
      <div className="flex items-center gap-3">
        <Badge variant={done ? "success" : "warning"}>{done ? "Hecho" : "Pendiente"}</Badge>
        <div className="leading-tight">
          <p className="text-sm font-medium">{label}</p>
          {hint ? (
            <p className="text-[0.7rem] text-[var(--color-muted-foreground)]">{hint}</p>
          ) : null}
        </div>
      </div>
      <ArrowRight className="size-4 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

function LiveTeam({
  team,
  align,
}: {
  team: { code: string; name: string; flagUrl: string | null } | null;
  align?: "start" | "end";
}) {
  const cls = align === "end" ? "flex-row-reverse text-right" : "";
  return (
    <div className={`flex min-w-0 items-center gap-2.5 ${cls}`}>
      <TeamFlag code={team?.code} size={40} />
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-none tracking-tight sm:text-2xl">
          {team?.name ?? "TBD"}
        </p>
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {team?.code ?? "—"}
        </p>
      </div>
    </div>
  );
}

function TeamCell({
  team,
  align,
}: {
  team: { code: string; name: string; flagUrl: string | null } | null;
  align: "start" | "end";
}) {
  const cls = align === "end" ? "flex-row-reverse text-right" : "";
  return (
    <div className={`flex min-w-0 items-center gap-3 ${cls}`}>
      <TeamFlag code={team?.code} size={36} />
      <div className="min-w-0">
        <p className="truncate font-display text-lg leading-none">{team?.name ?? "TBD"}</p>
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {team?.code ?? "—"}
        </p>
      </div>
    </div>
  );
}

