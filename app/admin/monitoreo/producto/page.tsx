import Link from "next/link";
import { Crown, TrendingUp, Trophy, Users } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";
import { initials } from "@/lib/utils";
import { PointsDistributionChart } from "../charts";

export const metadata = { title: "Producto · Monitoreo" };
export const dynamic = "force-dynamic";

type PredictionsCountsRow = {
  totalUsers: number;
  groupUsers: number;
  bracketUsers: number;
  topScorerUsers: number;
  specialUsers: number;
  matchResultUsers: number;
  matchScorerUsers: number;
};

type LeagueCountsRow = {
  totalLeagues: number;
  publicLeagues: number;
  privateLeagues: number;
};

type TopUserRow = {
  userId: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  points: number;
};

type TopLeagueRow = {
  leagueId: number;
  name: string;
  isPublic: boolean;
  members: number;
};

type BucketRow = { range: string; users: number };

const BUCKET_BOUNDS = [0, 1, 5, 10, 20, 50, 100, 500] as const;

function bucketLabel(min: number, max: number | null) {
  if (max == null) return `${min}+`;
  if (min === max) return `${min}`;
  return `${min}-${max}`;
}

export default async function MonitoringProductoPage() {
  await requireAdmin();

  // Cumplimiento por categoría: cuántos usuarios distintos tienen al menos
  // una predicción de cada tipo, vs total de usuarios.
  const [predRow] = await db.execute<PredictionsCountsRow>(sql`
    SELECT
      (SELECT count(*)::int FROM profiles)                                              AS "totalUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_group_ranking)                     AS "groupUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_bracket_slot)                      AS "bracketUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_tournament_top_scorer)             AS "topScorerUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_special)                           AS "specialUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_match_result)                      AS "matchResultUsers",
      (SELECT count(DISTINCT user_id)::int FROM pred_match_scorer)                      AS "matchScorerUsers"
  `);
  const preds = predRow as PredictionsCountsRow;

  const [leagueRow] = await db.execute<LeagueCountsRow>(sql`
    SELECT
      (SELECT count(*)::int FROM leagues)                              AS "totalLeagues",
      (SELECT count(*) FILTER (WHERE is_public)::int FROM leagues)     AS "publicLeagues",
      (SELECT count(*) FILTER (WHERE NOT is_public)::int FROM leagues) AS "privateLeagues"
  `);
  const leagues = leagueRow as LeagueCountsRow;

  // Top 10 usuarios por puntos (sumando points_ledger por usuario).
  const topUsers = (await db.execute<TopUserRow>(sql`
    SELECT
      p.id                AS "userId",
      p.email             AS email,
      p.nickname          AS nickname,
      p.avatar_url        AS "avatarUrl",
      COALESCE(SUM(pl.points), 0)::int AS points
    FROM profiles p
    LEFT JOIN points_ledger pl ON pl.user_id = p.id
    GROUP BY p.id
    ORDER BY points DESC, p.created_at ASC
    LIMIT 10
  `)) as TopUserRow[];

  // Top 10 ligas privadas por miembros.
  const topLeagues = (await db.execute<TopLeagueRow>(sql`
    SELECT
      l.id                 AS "leagueId",
      l.name               AS name,
      l.is_public          AS "isPublic",
      count(lm.user_id)::int AS members
    FROM leagues l
    LEFT JOIN league_memberships lm ON lm.league_id = l.id
    GROUP BY l.id
    ORDER BY members DESC, l.created_at ASC
    LIMIT 10
  `)) as TopLeagueRow[];

  // Buckets de distribución de puntos por usuario.
  const bucketRowsRaw = await db.execute<{ userPoints: number }>(sql`
    SELECT COALESCE(SUM(points), 0)::int AS "userPoints"
    FROM points_ledger
    GROUP BY user_id
  `);
  const bucketRows = bucketRowsRaw as { userPoints: number }[];
  // Incluimos a usuarios SIN entries en points_ledger (entran con 0 puntos).
  const usersWithoutLedger = Math.max(0, preds.totalUsers - bucketRows.length);
  const bucketCounts = new Map<string, number>();
  const pushBucket = (label: string) => {
    bucketCounts.set(label, (bucketCounts.get(label) ?? 0) + 1);
  };
  for (let i = 0; i < usersWithoutLedger; i++) pushBucket("0");
  for (const r of bucketRows) {
    const pts = Number(r.userPoints);
    let placed = false;
    for (let j = 0; j < BUCKET_BOUNDS.length; j++) {
      const lo = BUCKET_BOUNDS[j];
      const hi = (BUCKET_BOUNDS[j + 1] ?? null) as number | null;
      if (hi == null) {
        pushBucket(bucketLabel(lo, null));
        placed = true;
        break;
      }
      if (pts >= lo && pts < hi) {
        pushBucket(bucketLabel(lo, hi - 1));
        placed = true;
        break;
      }
    }
    if (!placed) pushBucket(`${pts}`);
  }
  const buckets: BucketRow[] = BUCKET_BOUNDS.map((lo, j) => {
    const hi = (BUCKET_BOUNDS[j + 1] ?? null) as number | null;
    const label = bucketLabel(lo, hi == null ? null : hi - 1);
    return { range: label, users: bucketCounts.get(label) ?? 0 };
  });

  const categories = [
    { key: "Grupos", count: preds.groupUsers },
    { key: "Bracket", count: preds.bracketUsers },
    { key: "Pichichi", count: preds.topScorerUsers },
    { key: "Especiales", count: preds.specialUsers },
    { key: "Resultados", count: preds.matchResultUsers },
    { key: "Goleadores", count: preds.matchScorerUsers },
  ];

  return (
    <div className="space-y-6">
      {/* ───────── Cumplimiento de predicciones ───────── */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <TrendingUp className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">
              Cumplimiento · usuarios con al menos 1 predicción
            </p>
          </div>
          <Badge variant="outline" className="text-[0.55rem]">
            {preds.totalUsers} usuarios totales
          </Badge>
        </header>
        <ul className="space-y-2">
          {categories.map((c) => {
            const pct = preds.totalUsers > 0 ? (c.count / preds.totalUsers) * 100 : 0;
            return (
              <li
                key={c.key}
                className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
              >
                <span className="w-28 shrink-0 font-display text-sm tracking-tight">{c.key}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-surface)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-arena)]"
                    style={{ width: `${Math.max(2, pct)}%` }}
                  />
                </div>
                <span className="w-20 shrink-0 text-right font-mono text-xs tabular text-[var(--color-muted-foreground)]">
                  {c.count} · {pct.toFixed(0)}%
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ───────── Distribución de puntos ───────── */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Trophy className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">
              Distribución de puntos · usuarios por bucket
            </p>
          </div>
        </header>
        <PointsDistributionChart data={buckets} />
      </section>

      {/* ───────── Top usuarios ───────── */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Crown className="size-4 text-[var(--color-arena)]" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">Top 10 usuarios</p>
          </div>
          <Link
            href="/ranking"
            className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-arena)] hover:underline"
          >
            Ver ranking completo →
          </Link>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Usuario</TableHead>
              <TableHead className="text-right">Puntos</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topUsers.map((u, i) => {
              const display = u.nickname || u.email.split("@")[0];
              const pos = i + 1;
              const isTop = pos === 1;
              return (
                <TableRow key={u.userId}>
                  <TableCell
                    className={`font-display tabular text-base ${
                      isTop ? "text-[var(--color-arena)] glow-arena" : "text-[var(--color-muted-foreground)]"
                    }`}
                  >
                    {pos.toString().padStart(2, "0")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-7 border border-[var(--color-border)]">
                        {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                        <AvatarFallback className="text-[0.55rem]">
                          {initials(display)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{display}</span>
                    </div>
                  </TableCell>
                  <TableCell
                    className={`text-right font-display tabular text-lg ${
                      isTop ? "text-[var(--color-arena)] glow-arena" : ""
                    }`}
                  >
                    {u.points}
                  </TableCell>
                </TableRow>
              );
            })}
            {topUsers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Sin puntos registrados todavía.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>

      {/* ───────── Ligas ───────── */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Ligas totales" value={leagues.totalLeagues} />
        <StatTile label="Públicas" value={leagues.publicLeagues} />
        <StatTile label="Privadas" value={leagues.privateLeagues} />
      </section>

      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-[var(--color-muted-foreground)]">
          <Users className="size-4" />
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">
            Top 10 ligas por miembros
          </p>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Liga</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Miembros</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topLeagues.map((l, i) => (
              <TableRow key={l.leagueId}>
                <TableCell className="text-xs text-[var(--color-muted-foreground)]">
                  {(i + 1).toString().padStart(2, "0")}
                </TableCell>
                <TableCell className="font-medium">{l.name}</TableCell>
                <TableCell>
                  <Badge variant={l.isPublic ? "default" : "outline"} className="text-[0.55rem]">
                    {l.isPublic ? "Pública" : "Privada"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right font-display tabular text-lg">
                  {l.members}
                </TableCell>
              </TableRow>
            ))}
            {topLeagues.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Sin ligas todavía.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </section>
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        {label}
      </p>
      <p className="mt-1 font-display tabular text-3xl tracking-tight">{value}</p>
    </div>
  );
}
