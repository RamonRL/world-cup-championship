import Link from "next/link";
import { Crown, ListOrdered } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pointsLedger, profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { initials } from "@/lib/utils";

export const metadata = { title: "Ranking" };

const KNOCKOUT_SOURCES = [
  "bracket_slot",
  "knockout_qualifier",
  "knockout_pens_bonus",
  "knockout_score_90",
] as const;

export default async function RankingPage() {
  const me = await requireUser();
  const leagueId = await currentLeagueId(me);
  // Sólo se rankean los miembros de la liga visible. El ledger se filtra en
  // memoria contra esos IDs en vez de hacer un join, así reusamos las dos
  // queries simples y evitamos n+1.
  const allUsers = leagueId == null
    ? await db.select().from(profiles)
    : await db.select().from(profiles).where(eq(profiles.leagueId, leagueId));
  const ledger = await db.select().from(pointsLedger);

  const championPredId = await db.execute<{ user_id: string; team_id: number }>(sql`
    SELECT user_id, predicted_team_id AS team_id
    FROM pred_bracket_slot
    WHERE stage = 'final' AND slot_position = 0
  `);
  const championByUser = new Map<string, number | null>();
  for (const row of championPredId as unknown as { user_id: string; team_id: number }[]) {
    championByUser.set(row.user_id, row.team_id);
  }
  const championTrue = await db.execute<{ winner_team_id: number | null }>(sql`
    SELECT winner_team_id FROM matches WHERE stage = 'final' ORDER BY scheduled_at DESC LIMIT 1
  `);
  const officialChampion = ((championTrue as unknown as { winner_team_id: number | null }[])[0])
    ?.winner_team_id ?? null;

  const stats = new Map<
    string,
    { totalPoints: number; exactScoresCount: number; knockoutPoints: number; championCorrect: boolean }
  >();
  for (const u of allUsers) {
    stats.set(u.id, {
      totalPoints: 0,
      exactScoresCount: 0,
      knockoutPoints: 0,
      championCorrect:
        officialChampion != null && championByUser.get(u.id) === officialChampion,
    });
  }
  for (const e of ledger) {
    const s = stats.get(e.userId);
    if (!s) continue;
    s.totalPoints += e.points;
    if (e.source === "match_exact_score" || e.source === "knockout_score_90") {
      s.exactScoresCount += 1;
    }
    if ((KNOCKOUT_SOURCES as readonly string[]).includes(e.source)) {
      s.knockoutPoints += e.points;
    }
  }

  const ranked = allUsers
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
      compareForRanking({ userId: a.user.id, ...a }, { userId: b.user.id, ...b }),
    );

  const myEntry = ranked.find((r) => r.user.id === me.id) ?? null;
  const myIndex = ranked.findIndex((r) => r.user.id === me.id);
  const leader = ranked[0] ?? null;
  const lead = leader ? leader.totalPoints - (myEntry?.totalPoints ?? 0) : 0;

  if (ranked.length === 0 || ranked.every((r) => r.totalPoints === 0)) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quiniela"
          title="Clasificación general"
          description="El ranking se actualiza automáticamente cuando el admin guarda resultados. Empates: marcadores exactos · puntos en eliminatorias · campeón acertado."
        />
        <EmptyState
          icon={<ListOrdered className="size-5" />}
          title="Sin puntos todavía"
          description="Cuando se cargue el primer resultado del torneo, el ranking arrancará."
        />
      </div>
    );
  }

  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quiniela"
        title="Clasificación general"
        description="Empates: marcadores exactos · puntos en eliminatorias · campeón acertado."
      />

      {/* Podium */}
      <section className="grid gap-3 sm:grid-cols-3">
        {[top3[1], top3[0], top3[2]].map((p, displayIdx) => {
          if (!p) {
            return (
              <div
                key={displayIdx}
                className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50"
              />
            );
          }
          const realPosition = displayIdx === 0 ? 2 : displayIdx === 1 ? 1 : 3;
          const isMe = p.user.id === me.id;
          const display = p.user.nickname || p.user.email.split("@")[0];
          return (
            <Link
              key={p.user.id}
              href={`/ranking/${p.user.id}`}
              className={`group relative overflow-hidden rounded-xl border bg-[var(--color-surface)] p-5 transition-all hover:-translate-y-0.5 hover:border-[var(--color-arena)]/60 ${
                realPosition === 1
                  ? "border-[var(--color-arena)]/60 sm:order-2 sm:-translate-y-2"
                  : "border-[var(--color-border)]"
              } ${isMe ? "ring-2 ring-[var(--color-arena)]/40 ring-offset-2 ring-offset-[var(--color-bg)]" : ""}`}
            >
              {realPosition === 1 ? (
                <div
                  className="halftone pointer-events-none absolute inset-0 opacity-[0.07]"
                  aria-hidden
                />
              ) : null}
              <div className="relative space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`font-display text-7xl leading-none ${
                      realPosition === 1
                        ? "text-[var(--color-arena)] glow-arena"
                        : "text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {realPosition}
                  </span>
                  {realPosition === 1 ? (
                    <Crown className="size-6 text-[var(--color-arena)]" />
                  ) : null}
                </div>
                <div className="flex items-center gap-3">
                  <Avatar className="size-10 border border-[var(--color-border)]">
                    {p.user.avatarUrl ? <AvatarImage src={p.user.avatarUrl} alt="" /> : null}
                    <AvatarFallback>{initials(display)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg tracking-tight">{display}</p>
                    {isMe ? (
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
                        Tú
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-end justify-between gap-2 border-t border-dashed border-[var(--color-border)] pt-3">
                  <div>
                    <p className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                      Puntos
                    </p>
                    <p className="font-display tabular text-4xl tracking-tight">
                      {p.totalPoints}
                    </p>
                  </div>
                  <div className="text-right text-xs text-[var(--color-muted-foreground)]">
                    <p>{p.exactScoresCount} exactos</p>
                    <p>{p.knockoutPoints} en KO</p>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </section>

      {/* My status */}
      {myEntry && myIndex >= 0 ? (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))] p-4">
          <div className="flex items-center gap-4">
            <span className="font-display text-5xl tabular text-[var(--color-arena)] glow-arena">
              #{(myIndex + 1).toString().padStart(2, "0")}
            </span>
            <div>
              <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Tu posición
              </p>
              <p className="font-display text-xl tracking-tight">
                {myEntry.user.nickname || myEntry.user.email.split("@")[0]}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              {myIndex === 0 ? "Líder" : `A ${lead} del líder`}
            </p>
            <p className="font-display text-3xl tabular">{myEntry.totalPoints}</p>
          </div>
        </div>
      ) : null}

      {/* Rest of the leaderboard */}
      {rest.length > 0 ? (
        <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <div className="grid grid-cols-[64px_1fr_80px_80px_80px] gap-2 border-b border-[var(--color-border)] px-4 py-3 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            <span>Pos</span>
            <span>Participante</span>
            <span className="text-right">Pts</span>
            <span className="hidden text-right sm:inline">Ex.</span>
            <span className="hidden text-right sm:inline">KO</span>
          </div>
          <ul>
            {rest.map((r, i) => {
              const position = i + 4;
              const isMe = r.user.id === me.id;
              const display = r.user.nickname || r.user.email.split("@")[0];
              return (
                <li key={r.user.id}>
                  <Link
                    href={`/ranking/${r.user.id}`}
                    className={`grid grid-cols-[64px_1fr_80px_80px_80px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 transition hover:bg-[var(--color-surface-2)] ${
                      isMe ? "bg-[color-mix(in_oklch,var(--color-arena)_6%,transparent)]" : ""
                    }`}
                  >
                    <span className="font-display text-2xl tabular text-[var(--color-muted-foreground)]">
                      {position.toString().padStart(2, "0")}
                    </span>
                    <span className="flex items-center gap-3 truncate">
                      <Avatar className="size-8 border border-[var(--color-border)]">
                        {r.user.avatarUrl ? <AvatarImage src={r.user.avatarUrl} alt="" /> : null}
                        <AvatarFallback>{initials(display)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate text-sm font-medium">{display}</span>
                      {isMe ? (
                        <Badge variant="default" className="ml-1">
                          Tú
                        </Badge>
                      ) : null}
                    </span>
                    <span className="text-right font-display tabular text-xl">{r.totalPoints}</span>
                    <span className="hidden text-right text-sm tabular text-[var(--color-muted-foreground)] sm:inline">
                      {r.exactScoresCount}
                    </span>
                    <span className="hidden text-right text-sm tabular text-[var(--color-muted-foreground)] sm:inline">
                      {r.knockoutPoints}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
