import Link from "next/link";
import { Award, Crown, ListOrdered, Medal } from "lucide-react";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pointsLedger, profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId, inLeagueFilter } from "@/lib/leagues";
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
  const leagueId = (await currentLeagueId(me))!;
  // Miembros de la liga activa.
  const filter = inLeagueFilter(leagueId);
  const allUsers = filter
    ? await db.select().from(profiles).where(filter)
    : await db.select().from(profiles);
  const ledger = await db
    .select()
    .from(pointsLedger)
    .where(eq(pointsLedger.leagueId, leagueId));

  // Picks de campeón scoped a esta liga.
  const championPredId = await db.execute<{ user_id: string; team_id: number }>(sql`
    SELECT user_id, predicted_team_id AS team_id
    FROM pred_bracket_slot
    WHERE stage = 'final' AND slot_position = 0 AND league_id = ${leagueId}
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

  if (ranked.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quiniela"
          title="Clasificación general"
          description="El ranking se actualiza automáticamente cuando el admin guarda resultados. Empates: marcadores exactos · puntos en eliminatorias · campeón acertado."
        />
        <EmptyState
          icon={<ListOrdered className="size-5" />}
          title="Sin participantes todavía"
          description="Cuando alguien se una a tu liga aparecerá aquí."
        />
      </div>
    );
  }

  const allZero = ranked.every((r) => r.totalPoints === 0);
  const top3 = ranked.slice(0, 3);
  const rest = ranked.slice(3);

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Quiniela"
        title="Clasificación general"
        description="Empates: marcadores exactos · puntos en eliminatorias · campeón acertado."
      />

      {allZero ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3 text-center font-editorial text-xs italic text-[var(--color-muted-foreground)]">
          Todavía no se ha cerrado ningún resultado — el orden cambiará en cuanto
          empiece el torneo.
        </div>
      ) : null}

      {/* Podium · DOM order [#1, #2, #3] (mobile stack natural). En sm+
          aplicamos sm:order-{1,2,3} a [#2, #1, #3] respectivamente y
          sm:items-end para que las alturas escalonadas alineen al base. */}
      <section className="grid items-end gap-3 sm:grid-cols-3">
        {top3.map((p, i) => {
          const position = i + 1;
          if (!p) {
            return (
              <div
                key={`empty-${position}`}
                className={`rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/50 ${
                  position === 1
                    ? "h-48 sm:order-2"
                    : position === 2
                      ? "h-40 sm:order-1"
                      : "h-36 sm:order-3"
                }`}
              />
            );
          }
          return (
            <PodiumCard
              key={p.user.id}
              position={position}
              entry={p}
              isMe={p.user.id === me.id}
            />
          );
        })}
      </section>

      {/* My status — sólo cuando NO estoy en el podio. Si ya estoy en
          top-3, mi tarjeta ya brilla arriba; redundancia evitada. */}
      {myEntry && myIndex >= 3 ? (
        <Link
          href={`/ranking/${me.id}`}
          className="group flex items-center justify-between gap-4 rounded-xl border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))] p-4 transition hover:border-[var(--color-arena)]"
        >
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
              A {lead} del líder
            </p>
            <p className="font-display text-3xl tabular">{myEntry.totalPoints}</p>
          </div>
        </Link>
      ) : null}

      {/* Rest of the leaderboard */}
      {rest.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-6 bg-[var(--color-arena)]" />
            <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Posiciones · 4 y siguientes
            </h2>
            <span className="h-px flex-1 bg-[var(--color-border)]" />
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
            <div className="grid grid-cols-[56px_1fr_72px_56px_56px] gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2.5 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)] sm:grid-cols-[56px_1fr_72px_64px_64px]">
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
                      className={`grid grid-cols-[56px_1fr_72px] items-center gap-2 border-b border-[var(--color-border)] px-4 py-3 last:border-b-0 transition hover:bg-[var(--color-surface-2)] sm:grid-cols-[56px_1fr_72px_64px_64px] ${
                        isMe
                          ? "bg-[color-mix(in_oklch,var(--color-arena)_6%,transparent)]"
                          : ""
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
                      <span className="text-right font-display tabular text-xl">
                        {r.totalPoints}
                      </span>
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
          </div>
        </section>
      ) : null}
    </div>
  );
}

type PodiumEntry = {
  user: typeof profiles.$inferSelect;
  totalPoints: number;
  exactScoresCount: number;
  knockoutPoints: number;
  championCorrect: boolean;
};

const PODIUM_LAYOUT: Record<
  number,
  {
    order: string;
    height: string;
    border: string;
    accent: string;
    icon: typeof Crown;
    iconClass: string;
    medalRing: string;
    label: string;
  }
> = {
  1: {
    order: "sm:order-2",
    height: "sm:min-h-[23rem]",
    border:
      "border-[var(--color-arena)]/60 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))]",
    accent: "text-[var(--color-arena)] glow-arena",
    icon: Crown,
    iconClass: "text-[var(--color-arena)]",
    medalRing: "ring-4 ring-[var(--color-arena)]",
    label: "Oro",
  },
  2: {
    order: "sm:order-1",
    height: "sm:min-h-[20rem]",
    border:
      "border-[var(--color-border-strong)] bg-[color-mix(in_oklch,var(--color-foreground)_3%,var(--color-surface))]",
    accent: "text-[var(--color-foreground)]",
    icon: Medal,
    iconClass: "text-[var(--color-foreground)]/70",
    medalRing: "ring-2 ring-[var(--color-border-strong)]",
    label: "Plata",
  },
  3: {
    order: "sm:order-3",
    height: "sm:min-h-[18.5rem]",
    border: "border-[var(--color-border)] bg-[var(--color-surface)]",
    accent: "text-[color-mix(in_oklch,var(--color-arena)_50%,var(--color-muted-foreground))]",
    icon: Award,
    iconClass:
      "text-[color-mix(in_oklch,var(--color-arena)_50%,var(--color-muted-foreground))]",
    medalRing:
      "ring-2 ring-[color-mix(in_oklch,var(--color-arena)_40%,var(--color-border-strong))]",
    label: "Bronce",
  },
};

function PodiumCard({
  position,
  entry,
  isMe,
}: {
  position: number;
  entry: PodiumEntry;
  isMe: boolean;
}) {
  const layout = PODIUM_LAYOUT[position]!;
  const Icon = layout.icon;
  const display = entry.user.nickname || entry.user.email.split("@")[0];
  // Avatares dimensionados por posición — el #1 dominante, decreciendo
  // en plata y bronce. La posición vive arriba a la izquierda como número
  // grande; el avatar va centrado horizontalmente para ser el foco visual.
  const avatarSize =
    position === 1
      ? "size-32 sm:size-40"
      : position === 2
        ? "size-28 sm:size-32"
        : "size-24 sm:size-28";
  const positionSize =
    position === 1 ? "text-6xl sm:text-7xl" : "text-5xl sm:text-6xl";
  const nameSize =
    position === 1 ? "text-xl sm:text-2xl" : "text-lg sm:text-xl";
  const pointsSize = position === 1 ? "text-4xl sm:text-5xl" : "text-3xl sm:text-4xl";

  return (
    <Link
      href={`/ranking/${entry.user.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-elev-2)] ${layout.order} ${layout.height} ${layout.border} ${
        isMe ? "ring-2 ring-[var(--color-arena)]/40 ring-offset-2 ring-offset-[var(--color-bg)]" : ""
      }`}
    >
      {position === 1 ? (
        <div
          className="halftone pointer-events-none absolute inset-0 opacity-[0.07]"
          aria-hidden
        />
      ) : null}

      {/* Posición · esquina superior izquierda */}
      <span
        className={`relative font-display leading-none tabular ${positionSize} ${layout.accent}`}
      >
        {position}
      </span>

      {/* Medalla + label · esquina superior derecha (absolute) */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-1">
        <Icon className={`size-6 ${layout.iconClass}`} />
        <span
          className={`font-mono text-[0.55rem] uppercase tracking-[0.28em] ${layout.iconClass}`}
        >
          {layout.label}
        </span>
      </div>

      {/* Avatar protagonista · centrado en el cuerpo de la tarjeta */}
      <div className="relative flex flex-1 flex-col items-center justify-center gap-3 py-3">
        <Avatar
          className={`${avatarSize} border-2 border-[var(--color-border-strong)] ${layout.medalRing}`}
        >
          {entry.user.avatarUrl ? <AvatarImage src={entry.user.avatarUrl} alt="" /> : null}
          <AvatarFallback className="font-display text-3xl tracking-tight">
            {initials(display)}
          </AvatarFallback>
        </Avatar>
        <div className="px-2 text-center">
          <p className={`truncate font-display tracking-tight ${nameSize}`}>
            {display}
          </p>
          {isMe ? (
            <p className="mt-0.5 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
              Tú
            </p>
          ) : null}
        </div>
      </div>

      {/* Footer · puntos + sub-stats */}
      <div className="relative flex items-end justify-between gap-2 border-t border-dashed border-[var(--color-border)] pt-3">
        <div>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            Puntos
          </p>
          <p
            className={`font-display tabular tracking-tight ${pointsSize} ${layout.accent}`}
          >
            {entry.totalPoints}
          </p>
        </div>
        <div className="text-right font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
          <p>{entry.exactScoresCount} exactos</p>
          <p>{entry.knockoutPoints} en KO</p>
        </div>
      </div>
    </Link>
  );
}
