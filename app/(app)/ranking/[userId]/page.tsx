import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { pointsLedger, profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { ListOrdered } from "lucide-react";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { loadActivityFeed } from "@/lib/activity-feed";
import { formatDateTime, initials } from "@/lib/utils";

const KNOCKOUT_SOURCES = [
  "bracket_slot",
  "knockout_qualifier",
  "knockout_pens_bonus",
  "knockout_score_90",
] as const;

const SOURCE_LABEL: Record<string, string> = {
  match_exact_score: "Marcador exacto",
  match_outcome: "Ganador acertado",
  knockout_score_90: "Resultado en 90'",
  knockout_qualifier: "Clasificado acertado",
  knockout_pens_bonus: "Penaltis",
  match_scorer: "Goleador",
  match_first_scorer: "Primer gol",
  group_position: "Posición de grupo",
  group_top2_swap: "Top-2 cambiado",
  bracket_slot: "Bracket",
  tournament_top_scorer: "Bota de Oro",
  special_prediction: "Especial",
};

type CategoryRow = {
  source: string;
  label: string;
  count: number;
  total: number;
};

export const metadata = { title: "Detalle de participante" };

export default async function ParticipantDetailPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const me = await requireUser();
  const { userId } = await params;
  const leagueId = await currentLeagueId(me);

  const [user] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  if (!user) notFound();
  // Si el usuario consultado no pertenece a la liga visible, lo tratamos
  // como inexistente (privacidad cross-league).
  if (
    me.role !== "admin" &&
    leagueId != null &&
    user.leagueId !== leagueId
  ) {
    notFound();
  }

  const [allUsers, allLedger, theirLedger] = await Promise.all([
    leagueId == null
      ? db.select().from(profiles)
      : db.select().from(profiles).where(eq(profiles.leagueId, leagueId)),
    db.select().from(pointsLedger),
    db
      .select()
      .from(pointsLedger)
      .where(eq(pointsLedger.userId, userId))
      .orderBy(desc(pointsLedger.computedAt)),
  ]);

  // Compute leaderboard to know this user's position
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
  const idx = ranked.findIndex((r) => r.user.id === userId);
  const myStats = stats.get(userId) ?? {
    totalPoints: 0,
    exactScoresCount: 0,
    knockoutPoints: 0,
    championCorrect: false,
  };

  // Per-category breakdown (count of entries + total points)
  const byCategory = new Map<string, { count: number; total: number }>();
  for (const e of theirLedger) {
    const existing = byCategory.get(e.source) ?? { count: 0, total: 0 };
    existing.count += 1;
    existing.total += e.points;
    byCategory.set(e.source, existing);
  }
  const categories: CategoryRow[] = Array.from(byCategory.entries()).map(
    ([source, v]) => ({
      source,
      label: SOURCE_LABEL[source] ?? source,
      count: v.count,
      total: v.total,
    }),
  );
  categories.sort((a, b) => b.total - a.total);

  // Recent activity (use the same hydrator)
  const recent = await loadActivityFeed(userId, 12);

  const display = user.nickname || user.email.split("@")[0];
  const isMe = user.id === me.id;

  return (
    <div className="space-y-8">
      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/ranking">
          <ArrowLeft />
          Volver al ranking
        </Link>
      </Button>

      <PageHeader
        eyebrow="Participante"
        title={display}
        description={
          idx >= 0
            ? `Puesto #${idx + 1} de ${ranked.length} · ${myStats.totalPoints} puntos · ${myStats.exactScoresCount} marcadores exactos`
            : "Sin puntos en el torneo todavía."
        }
        actions={
          <div className="flex items-center gap-3">
            <Avatar className="size-12 border border-[var(--color-border-strong)]">
              {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
              <AvatarFallback>{initials(display)}</AvatarFallback>
            </Avatar>
            {isMe ? (
              <Badge variant="default">Tú</Badge>
            ) : (
              <Badge variant="outline">{user.role === "admin" ? "Admin" : "Participante"}</Badge>
            )}
          </div>
        }
      />

      {theirLedger.length === 0 ? (
        <EmptyState
          icon={<ListOrdered className="size-5" />}
          title="Sin puntos todavía"
          description={
            isMe
              ? "Cuando empiece a haber resultados, tu desglose aparecerá aquí."
              : "Este participante aún no ha sumado puntos."
          }
        />
      ) : (
        <>
          {/* Stat strip */}
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox label="Puntos" value={myStats.totalPoints.toString()} accent />
            <StatBox label="Posición" value={idx >= 0 ? `#${idx + 1}` : "—"} />
            <StatBox label="Marcadores exactos" value={myStats.exactScoresCount.toString()} />
            <StatBox label="En eliminatorias" value={myStats.knockoutPoints.toString()} />
          </section>

          {/* Per-category breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Desglose por categoría</CardTitle>
              <CardDescription>
                Cuántos puntos vienen de cada tipo de predicción.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {categories.map((c) => (
                  <li
                    key={c.source}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        {c.count} {c.count === 1 ? "acierto" : "aciertos"}
                      </p>
                    </div>
                    <span className="font-display tabular text-2xl text-[var(--color-arena)] glow-arena">
                      +{c.total}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Aciertos recientes</CardTitle>
              <CardDescription>Últimos puntos sumados al ledger.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-2 sm:grid-cols-2">
                {recent.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{a.label}</p>
                      <p className="truncate font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        {a.detail ?? formatDateTime(a.computedAt, { day: "2-digit", month: "short" })}
                      </p>
                    </div>
                    <span className="font-display tabular text-xl text-[var(--color-arena)]">
                      +{a.points}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function StatBox({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 ${
        accent
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))]"
          : "border-[var(--color-border)] bg-[var(--color-surface)]"
      }`}
    >
      <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p
        className={`mt-2 font-display tabular text-5xl tracking-tight ${
          accent ? "text-[var(--color-arena)] glow-arena" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
