import { TeamFlag } from "@/components/brand/team-flag";
import Link from "next/link";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predBracketSlot, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { Swords, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";
import { BracketTree, type BracketMatch } from "@/components/bracket/bracket-tree";

export const metadata = { title: "Bracket" };

const STAGE_LABEL = {
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
} as const;

const KO_STAGES = ["r32", "r16", "qf", "sf", "final", "third"] as const;
type KoStage = (typeof KO_STAGES)[number];

export default async function BracketPage() {
  const me = await requireUser();
  const koMatches = await db
    .select()
    .from(matches)
    .where(inArray(matches.stage, [...KO_STAGES] as KoStage[]))
    .orderBy(asc(matches.scheduledAt));

  const teamIds = koMatches
    .flatMap((m) => [m.homeTeamId, m.awayTeamId, m.winnerTeamId])
    .filter((x): x is number => x != null);
  const allTeams =
    teamIds.length > 0
      ? await db.select().from(teams).where(inArray(teams.id, teamIds))
      : [];
  const teamById = new Map(allTeams.map((t) => [t.id, t]));

  const myPreds = await db
    .select()
    .from(predBracketSlot)
    .where(eq(predBracketSlot.userId, me.id));

  const myByStage = new Map<string, Set<number>>();
  for (const p of myPreds) {
    if (!p.predictedTeamId) continue;
    if (p.stage === "final" && p.slotPosition === 0) continue;
    const set = myByStage.get(p.stage) ?? new Set<number>();
    set.add(p.predictedTeamId);
    myByStage.set(p.stage, set);
  }
  const myChampion =
    myPreds.find((m) => m.stage === "final" && m.slotPosition === 0)?.predictedTeamId ?? null;

  if (koMatches.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Eliminación directa"
          title="Bracket del torneo"
          description="Aparecerá cuando el admin cargue las llaves de eliminación directa."
        />
        <EmptyState
          icon={<Swords className="size-5" />}
          title="Sin partidos eliminatorios"
          description="Programa la fase eliminatoria desde /admin/calendario."
        />
      </div>
    );
  }

  // Build matches map for the BracketTree component
  const treeMap = new Map<string, BracketMatch>();
  for (const m of koMatches) {
    const home = m.homeTeamId ? teamById.get(m.homeTeamId) ?? null : null;
    const away = m.awayTeamId ? teamById.get(m.awayTeamId) ?? null : null;
    treeMap.set(m.code, {
      id: m.id,
      code: m.code,
      scheduledAt: m.scheduledAt,
      homeTeam: home
        ? { id: home.id, code: home.code, name: home.name, flagUrl: home.flagUrl }
        : null,
      awayTeam: away
        ? { id: away.id, code: away.code, name: away.name, flagUrl: away.flagUrl }
        : null,
      winnerTeamId: m.winnerTeamId ?? null,
      homeScore: m.homeScore ?? null,
      awayScore: m.awayScore ?? null,
      status: m.status,
      wentToPens: m.wentToPens,
      homeScorePen: m.homeScorePen ?? null,
      awayScorePen: m.awayScorePen ?? null,
    });
  }

  const myPicks = {
    r16: myByStage.get("r16") ?? new Set<number>(),
    qf: myByStage.get("qf") ?? new Set<number>(),
    sf: myByStage.get("sf") ?? new Set<number>(),
    finalists: myByStage.get("final") ?? new Set<number>(),
    championTeamId: myChampion,
  };

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Eliminación directa"
        title="Bracket del torneo"
        description="32 → 16 → 8 → 4 → 2 → 1. El árbol oficial de FIFA con tus picks resaltados (●) y los aciertos en verde."
        actions={
          <Link
            href="/predicciones/bracket"
            className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--color-foreground)] transition hover:border-[var(--color-arena)]/50"
          >
            Editar mi bracket
          </Link>
        }
      />

      <Legend />

      {/* Desktop tree */}
      <div className="hidden lg:block">
        <BracketTree matches={treeMap} myPicks={myPicks} />
      </div>

      {/* Mobile list fallback */}
      <div className="space-y-6 lg:hidden">
        {KO_STAGES.filter((s) => s !== "third").map((stage) => {
          const stageMatches = koMatches.filter((m) => m.stage === stage);
          if (stageMatches.length === 0) return null;
          const myPicksHere = myByStage.get(stage) ?? new Set();
          return (
            <section key={stage} className="space-y-2">
              <h2 className="font-display text-2xl tracking-tight">
                {STAGE_LABEL[stage]}
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {stageMatches.map((m) => {
                  const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                  const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                  return (
                    <Card key={m.id}>
                      <CardHeader className="flex flex-row items-center justify-between p-3">
                        <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                          {m.code} ·{" "}
                          {formatDateTime(m.scheduledAt, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge
                          variant={m.status === "finished" ? "success" : "outline"}
                        >
                          {m.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-1.5 p-3 pt-0">
                        <MobileTeamRow
                          team={home}
                          score={m.homeScore}
                          isWinner={m.winnerTeamId === m.homeTeamId}
                          isMyPick={home ? myPicksHere.has(home.id) : false}
                        />
                        <MobileTeamRow
                          team={away}
                          score={m.awayScore}
                          isWinner={m.winnerTeamId === m.awayTeamId}
                          isMyPick={away ? myPicksHere.has(away.id) : false}
                        />
                        {m.wentToPens ? (
                          <p className="text-[0.65rem] text-[var(--color-muted-foreground)]">
                            Pen.: {m.homeScorePen ?? 0} – {m.awayScorePen ?? 0}
                          </p>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Champion strip */}
      <section className="rounded-xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,var(--color-surface))] p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-md bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]">
              <Trophy className="size-5" />
            </span>
            <div>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Tu campeón
              </p>
              <p className="font-display text-3xl tracking-tight">
                {myChampion ? teamById.get(myChampion)?.name ?? "—" : "Sin elegir"}
              </p>
            </div>
          </div>
          {myChampion && teamById.get(myChampion) ? (
            <TeamFlag code={teamById.get(myChampion)!.code} size={48} />
          ) : (
            <Link
              href="/predicciones/bracket"
              className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-arena)]"
            >
              Elegir campeón →
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2 text-xs text-[var(--color-muted-foreground)]">
      <span className="flex items-center gap-1.5">
        <span className="size-2 rounded-full bg-[var(--color-success)]" />
        Equipo que avanzó
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[0.7rem] text-[var(--color-arena)]">
        ● Tu pick
      </span>
      <span className="ml-auto hidden font-mono text-[0.6rem] uppercase tracking-[0.32em] sm:inline">
        Tap any match for details
      </span>
    </div>
  );
}

function MobileTeamRow({
  team,
  score,
  isWinner,
  isMyPick,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
  score: number | null;
  isWinner: boolean;
  isMyPick: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-md border px-2 py-1.5 ${
        isWinner
          ? "border-[var(--color-success)]/40 bg-[var(--color-success)]/10"
          : "border-transparent"
      }`}
    >
      <div className="flex min-w-0 items-center gap-2">
        <TeamFlag code={team?.code} size={20} />
        <span className="truncate text-sm font-medium">{team?.name ?? "TBD"}</span>
        {isMyPick ? (
          <span className="font-mono text-[0.65rem] text-[var(--color-arena)]">●</span>
        ) : null}
      </div>
      <span className="font-display tabular text-base">
        {score != null ? score : "·"}
      </span>
    </div>
  );
}
