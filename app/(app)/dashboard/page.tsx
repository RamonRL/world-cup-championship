import Link from "next/link";
import { ArrowRight, CalendarClock, ClipboardList, ListOrdered, Trophy } from "lucide-react";
import { and, asc, desc, eq, gt, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  matchdays,
  matches,
  pointsLedger,
  predGroupRanking,
  predMatchResult,
  predMatchScorer,
  predTournamentTopScorer,
  profiles,
  teams,
} from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";

const KICKOFF = process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z";

export default async function DashboardPage() {
  const me = await requireUser();
  const kickoff = new Date(KICKOFF);
  const days = Math.max(0, Math.ceil((kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  // Stats
  const [myPointsRow] = await db
    .select({ total: sql<number>`coalesce(sum(${pointsLedger.points}), 0)::int` })
    .from(pointsLedger)
    .where(eq(pointsLedger.userId, me.id));
  const myPoints = myPointsRow?.total ?? 0;

  const allUsers = await db.select().from(profiles);
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

  // Next deadline
  const upcomingMatchdays = await db
    .select()
    .from(matchdays)
    .where(gt(matchdays.predictionDeadlineAt, new Date()))
    .orderBy(asc(matchdays.predictionDeadlineAt))
    .limit(1);

  // Pending matches that haven't kicked off and the user hasn't predicted scorer for
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

  // Pre-tournament forms still pending?
  const [groupCount, topScorerSet, predMatchCountRow, recentMatch] = await Promise.all([
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
      .from(predMatchResult)
      .where(eq(predMatchResult.userId, me.id)),
    db
      .select()
      .from(matches)
      .where(eq(matches.status, "finished"))
      .orderBy(desc(matches.scheduledAt))
      .limit(3),
  ]);

  // Resolve recent match team names
  const teamIds = recentMatch
    .flatMap((m) => [m.homeTeamId, m.awayTeamId])
    .filter((x): x is number => x != null);
  const recentTeams =
    teamIds.length > 0
      ? await db.select().from(teams).where(sql`id = ANY(${sql.raw(`ARRAY[${teamIds.join(",")}]::int[]`)})`)
      : [];
  const teamById = new Map(recentTeams.map((t) => [t.id, t]));

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <Badge variant="success" className="gap-1.5 text-[0.7rem] uppercase tracking-wider">
            <span className="size-1.5 rounded-full bg-[var(--color-success)]" /> Faltan {days}{" "}
            días
          </Badge>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            Hola, {me.nickname || me.email.split("@")[0]}
          </h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Tu vista rápida de la quiniela: posición, próximos cierres y resultados recientes.
          </p>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardStat
          icon={<ListOrdered className="size-4" />}
          label="Tu posición"
          value={myPosition != null ? `#${myPosition}` : "—"}
          hint={
            myPosition != null
              ? `de ${sorted.length} participantes`
              : "Sin puntos en juego todavía"
          }
        />
        <DashboardStat
          icon={<Trophy className="size-4" />}
          label="Puntos totales"
          value={myPoints.toString()}
          hint="Acumulados durante el torneo"
        />
        <DashboardStat
          icon={<ClipboardList className="size-4" />}
          label="Goleadores pendientes"
          value={pendingScorers.toString()}
          hint="Partidos próximos sin tu pick"
        />
        <DashboardStat
          icon={<CalendarClock className="size-4" />}
          label="Próximo cierre"
          value={
            upcomingMatchdays[0]
              ? formatDateTime(upcomingMatchdays[0].predictionDeadlineAt, {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "—"
          }
          hint={upcomingMatchdays[0]?.name ?? "Sin jornadas activas"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Predicciones pre-torneo</CardTitle>
            <CardDescription>
              Cierra todo antes del kickoff ({formatDateTime(kickoff)}).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <PreCheck
              done={(groupCount[0]?.c ?? 0) === 12}
              label="Posiciones de grupo (12 grupos)"
              href="/predicciones/grupos"
            />
            <PreCheck
              done={topScorerSet.length > 0}
              label="Bota de Oro"
              href="/predicciones/goleador-torneo"
            />
            <PreCheck
              done={false}
              label="Predicciones especiales"
              href="/predicciones/especiales"
              soft
            />
            <PreCheck
              done={(predMatchCountRow[0]?.c ?? 0) > 0}
              label="Bracket eliminatorio"
              href="/predicciones/bracket"
              soft
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Resultados recientes</CardTitle>
            <CardDescription>Lo último que ha cargado el admin.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {recentMatch.length === 0 ? (
              <p className="text-[var(--color-muted-foreground)]">
                Sin resultados todavía. Cuando termine el primer partido lo verás aquí.
              </p>
            ) : (
              recentMatch.map((m) => {
                const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                return (
                  <Link
                    key={m.id}
                    href={`/partido/${m.id}`}
                    className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2 transition hover:border-[var(--color-primary)]/40"
                  >
                    <span className="truncate">
                      {home?.name ?? "—"} vs {away?.name ?? "—"}
                    </span>
                    <span className="font-display tabular-nums">
                      {m.homeScore} – {m.awayScore}
                    </span>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DashboardStat({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-5">
        <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
          {icon}
          <span className="text-xs uppercase tracking-wider">{label}</span>
        </div>
        <div className="font-display text-3xl">{value}</div>
        <div className="text-xs text-[var(--color-muted-foreground)]">{hint}</div>
      </CardContent>
    </Card>
  );
}

function PreCheck({
  done,
  label,
  href,
  soft,
}: {
  done: boolean;
  label: string;
  href: string;
  soft?: boolean;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-md border border-[var(--color-border)] p-2 transition hover:border-[var(--color-primary)]/40"
    >
      <div className="flex items-center gap-2">
        <Badge
          variant={done ? "success" : soft ? "outline" : "warning"}
          className="text-[0.6rem]"
        >
          {done ? "Hecho" : "Pendiente"}
        </Badge>
        <span className="text-sm">{label}</span>
      </div>
      <ArrowRight className="size-4 text-[var(--color-muted-foreground)]" />
    </Link>
  );
}

function _unused() {
  // Placeholder to silence unused import warnings if we trim later
  return Button;
}
