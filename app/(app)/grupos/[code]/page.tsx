import { TeamFlag } from "@/components/brand/team-flag";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { and, asc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groupStandings,
  groups,
  matches,
  predGroupRanking,
  profiles,
  teams,
} from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime, initials } from "@/lib/utils";

export const metadata = { title: "Grupo" };

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const me = await requireUser();
  const { code } = await params;
  const upper = code.toUpperCase();

  const [group] = await db
    .select()
    .from(groups)
    .where(eq(groups.code, upper))
    .limit(1);
  if (!group) notFound();

  const [groupTeams, standings, groupMatches] = await Promise.all([
    db
      .select()
      .from(teams)
      .where(eq(teams.groupId, group.id))
      .orderBy(asc(teams.name)),
    db.select().from(groupStandings).where(eq(groupStandings.groupId, group.id)),
    db
      .select()
      .from(matches)
      .where(and(eq(matches.groupId, group.id), eq(matches.stage, "group")))
      .orderBy(asc(matches.scheduledAt)),
  ]);

  const teamById = new Map(groupTeams.map((t) => [t.id, t]));
  const standingByTeam = new Map(standings.map((s) => [s.teamId, s]));

  // Predictions: group rankings become public when the first group match starts.
  const firstMatchAt = groupMatches[0]?.scheduledAt ?? null;
  const ranksPublic = firstMatchAt ? new Date(firstMatchAt).getTime() <= Date.now() : false;

  const [myPred, otherPreds] = await Promise.all([
    db
      .select()
      .from(predGroupRanking)
      .where(
        and(eq(predGroupRanking.userId, me.id), eq(predGroupRanking.groupId, group.id)),
      )
      .limit(1),
    ranksPublic
      ? db
          .select({
            userId: predGroupRanking.userId,
            pos1TeamId: predGroupRanking.pos1TeamId,
            pos2TeamId: predGroupRanking.pos2TeamId,
            pos3TeamId: predGroupRanking.pos3TeamId,
            pos4TeamId: predGroupRanking.pos4TeamId,
            email: profiles.email,
            nickname: profiles.nickname,
            avatarUrl: profiles.avatarUrl,
          })
          .from(predGroupRanking)
          .leftJoin(profiles, eq(predGroupRanking.userId, profiles.id))
          .where(
            and(eq(predGroupRanking.groupId, group.id), ne(predGroupRanking.userId, me.id)),
          )
      : Promise.resolve([]),
  ]);

  const sortedTeams = [...groupTeams].sort((a, b) => {
    const sa = standingByTeam.get(a.id)?.position ?? 99;
    const sb = standingByTeam.get(b.id)?.position ?? 99;
    if (sa !== sb) return sa - sb;
    return a.name.localeCompare(b.name);
  });

  const myPredPositions = myPred[0]
    ? [myPred[0].pos1TeamId, myPred[0].pos2TeamId, myPred[0].pos3TeamId, myPred[0].pos4TeamId]
    : [];

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/grupos">
          <ArrowLeft />
          Volver a grupos
        </Link>
      </Button>

      <PageHeader
        eyebrow={`Grupo ${group.code}`}
        title={group.name}
        description={`${groupTeams.length} selecciones · ${groupMatches.length} partidos · top 2 + mejor tercero pasan a R32.`}
      />

      {/* Standings */}
      <article className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex items-baseline justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl tracking-tight text-[var(--color-arena)] glow-arena">
              {group.code}
            </span>
            <span className="font-display text-xl tracking-tight">Clasificación</span>
          </div>
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Top 2 → R32
          </span>
        </header>

        <div className="grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px_36px_44px_60px] gap-2 border-b border-[var(--color-border)] px-4 py-2 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
          <span>#</span>
          <span>Selección</span>
          <span className="text-right">PJ</span>
          <span className="text-right">G</span>
          <span className="text-right">E</span>
          <span className="text-right">P</span>
          <span className="text-right">GF</span>
          <span className="text-right">GC</span>
          <span className="text-right">Pts</span>
          <span className="text-right">Tu pick</span>
        </div>
        <ul>
          {sortedTeams.map((t, i) => {
            const s = standingByTeam.get(t.id);
            const pos = i + 1;
            const advances = pos <= 2;
            const limbo = pos === 3;
            const myPickPos = myPredPositions.findIndex((id) => id === t.id);
            return (
              <li
                key={t.id}
                className={`grid grid-cols-[28px_1fr_28px_28px_28px_28px_36px_36px_44px_60px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-2.5 last:border-b-0 ${
                  advances
                    ? "bg-[color-mix(in_oklch,var(--color-success)_6%,transparent)]"
                    : limbo
                      ? "bg-[color-mix(in_oklch,var(--color-accent)_6%,transparent)]"
                      : ""
                }`}
              >
                <span
                  className={`font-display tabular text-base ${
                    advances ? "text-[var(--color-success)]" : "text-[var(--color-muted-foreground)]"
                  }`}
                >
                  {pos}
                </span>
                <span className="flex items-center gap-2 truncate">
                  <TeamFlag code={t.code} size={20} />
                  <span className="truncate text-sm font-medium">{t.name}</span>
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.played ?? 0}
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.won ?? 0}
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.drawn ?? 0}
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.lost ?? 0}
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.goalsFor ?? 0}
                </span>
                <span className="text-right text-xs tabular text-[var(--color-muted-foreground)]">
                  {s?.goalsAgainst ?? 0}
                </span>
                <span className="text-right font-display tabular text-lg">
                  {s?.points ?? 0}
                </span>
                <span className="text-right">
                  {myPickPos >= 0 ? (
                    <span className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-arena)]">
                      {myPickPos + 1}º
                    </span>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </article>

      {/* Matches */}
      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-[var(--color-arena)]" />
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Partidos del grupo
          </h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {groupMatches.map((m) => {
            const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
            const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
            const status =
              m.status === "finished" ? "FINAL" : m.status === "live" ? "EN VIVO" : "PROGRAMADO";
            return (
              <Link
                key={m.id}
                href={`/partido/${m.id}`}
                className="group block overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-arena)]/40 hover:shadow-[var(--shadow-elev-2)]"
              >
                <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2">
                  <span className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                    {m.code} ·{" "}
                    {formatDateTime(m.scheduledAt, {
                      weekday: "short",
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
                  >
                    {status}
                  </Badge>
                </div>
                <div className="space-y-2 p-4">
                  <TeamLine team={home} score={m.homeScore} winner={m.winnerTeamId === home?.id} />
                  <TeamLine team={away} score={m.awayScore} winner={m.winnerTeamId === away?.id} />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* My prediction */}
      <Card>
        <CardHeader>
          <CardTitle>Tu predicción</CardTitle>
          <CardDescription>
            Tus posiciones predichas para este grupo. Editable hasta el kickoff del torneo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {myPred.length === 0 ? (
            <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
              Aún sin predicción. Hazla en{" "}
              <Link className="underline" href="/predicciones/grupos">
                Predicciones · Posiciones
              </Link>
              .
            </p>
          ) : (
            <ol className="grid gap-2 sm:grid-cols-2">
              {myPredPositions.map((teamId, i) => {
                const team = teamId ? teamById.get(teamId) : null;
                const advances = i < 2;
                return (
                  <li
                    key={i}
                    className={`flex items-center gap-3 rounded-md border p-2.5 ${
                      advances
                        ? "border-[var(--color-success)]/40 bg-[color-mix(in_oklch,var(--color-success)_6%,transparent)]"
                        : "border-[var(--color-border)] bg-[var(--color-surface-2)]"
                    }`}
                  >
                    <span className="font-display text-2xl tabular text-[var(--color-arena)]">
                      {i + 1}
                    </span>
                    <TeamFlag code={team?.code} size={28} />
                    <span className="flex-1 truncate text-sm font-medium">
                      {team?.name ?? "—"}
                    </span>
                    {advances ? (
                      <Badge variant="success" className="text-[0.55rem]">
                        Pasa
                      </Badge>
                    ) : null}
                  </li>
                );
              })}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Predicciones de la peña */}
      {ranksPublic ? (
        <Card>
          <CardHeader>
            <CardTitle>Predicciones de la peña</CardTitle>
            <CardDescription>
              Top-2 que cada participante predijo para este grupo. Públicas desde el primer
              partido de grupo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {otherPreds.length === 0 ? (
              <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                Nadie más predijo este grupo.
              </p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {otherPreds.map((p) => {
                  const display = p.nickname || p.email?.split("@")[0] || "—";
                  const t1 = p.pos1TeamId ? teamById.get(p.pos1TeamId) : null;
                  const t2 = p.pos2TeamId ? teamById.get(p.pos2TeamId) : null;
                  return (
                    <li
                      key={p.userId}
                      className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] p-2.5"
                    >
                      <Avatar className="size-7 border border-[var(--color-border)]">
                        {p.avatarUrl ? <AvatarImage src={p.avatarUrl} alt="" /> : null}
                        <AvatarFallback className="text-[0.6rem]">
                          {initials(display)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="flex-1 truncate text-sm font-medium">{display}</span>
                      <span className="flex items-center gap-1.5 text-xs text-[var(--color-muted-foreground)]">
                        <Badge variant="outline" className="text-[0.55rem]">
                          1º {t1?.code ?? "?"}
                        </Badge>
                        <Badge variant="outline" className="text-[0.55rem]">
                          2º {t2?.code ?? "?"}
                        </Badge>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function TeamLine({
  team,
  score,
  winner,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
  score: number | null;
  winner: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        <TeamFlag code={team?.code} size={24} />
        <span
          className={`truncate text-sm font-medium ${
            winner ? "text-[var(--color-success)]" : ""
          }`}
        >
          {team?.name ?? "—"}
        </span>
      </div>
      <span className="font-display tabular text-2xl">
        {score != null ? score : <span className="text-[var(--color-muted-foreground)]">·</span>}
      </span>
    </div>
  );
}
