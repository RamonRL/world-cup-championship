import Image from "next/image";
import { asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches, predBracketSlot, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { Swords, Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";

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
    if (p.stage === "final" && p.slotPosition === 0) continue; // champion handled separately
    const set = myByStage.get(p.stage) ?? new Set<number>();
    set.add(p.predictedTeamId);
    myByStage.set(p.stage, set);
  }
  const myChampion = myPreds.find((m) => m.stage === "final" && m.slotPosition === 0)?.predictedTeamId ?? null;

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

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Eliminación directa"
        title="Bracket del torneo"
        description="Tus predicciones se resaltan en cada ronda. Las verdes son tus aciertos confirmados."
      />
      <div className="space-y-6">
        {KO_STAGES.filter((s) => s !== "third").map((stage) => {
          const stageMatches = koMatches.filter((m) => m.stage === stage);
          if (stageMatches.length === 0) return null;
          const myPicksHere = myByStage.get(stage) ?? new Set();
          return (
            <section key={stage} className="space-y-2">
              <h2 className="font-display text-2xl">{STAGE_LABEL[stage]}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {stageMatches.map((m) => {
                  const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                  const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                  return (
                    <Card key={m.id}>
                      <CardHeader className="flex flex-row items-center justify-between p-3">
                        <span className="text-xs text-[var(--color-muted-foreground)]">
                          {formatDateTime(m.scheduledAt, {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <Badge
                          variant={m.status === "finished" ? "success" : "outline"}
                          className="text-[0.6rem]"
                        >
                          {m.status}
                        </Badge>
                      </CardHeader>
                      <CardContent className="space-y-1.5 p-3 pt-0">
                        <BracketTeam
                          team={home}
                          score={m.homeScore}
                          isWinner={m.winnerTeamId === m.homeTeamId}
                          isMyPick={home ? myPicksHere.has(home.id) : false}
                        />
                        <BracketTeam
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

        <section className="space-y-2">
          <h2 className="font-display text-2xl">Tu campeón</h2>
          {myChampion ? (
            <Card>
              <CardContent className="flex items-center gap-3 p-4">
                <Trophy className="size-6 text-[var(--color-primary)]" />
                <span className="grid size-10 place-items-center overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  {teamById.get(myChampion)?.flagUrl ? (
                    <Image
                      src={teamById.get(myChampion)!.flagUrl!}
                      alt={teamById.get(myChampion)!.code}
                      width={40}
                      height={40}
                    />
                  ) : null}
                </span>
                <span className="font-display text-2xl">
                  {teamById.get(myChampion)?.name ?? "—"}
                </span>
              </CardContent>
            </Card>
          ) : (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Aún no has elegido campeón. Hazlo en{" "}
              <a className="underline" href="/predicciones/bracket">
                Predicciones · Bracket
              </a>
              .
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

function BracketTeam({
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
        <span className="grid size-5 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          {team?.flagUrl ? (
            <Image src={team.flagUrl} alt={team.code} width={20} height={20} />
          ) : null}
        </span>
        <span className="truncate text-sm font-medium">{team?.name ?? "—"}</span>
        {isMyPick ? (
          <Badge
            variant={isWinner ? "success" : "outline"}
            className="ml-1 text-[0.55rem]"
          >
            Mi pick
          </Badge>
        ) : null}
      </div>
      <span className="font-display tabular-nums">
        {score != null ? score : "·"}
      </span>
    </div>
  );
}
