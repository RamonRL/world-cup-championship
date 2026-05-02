import Link from "next/link";
import { TeamFlag } from "@/components/brand/team-flag";
import { CalendarDays } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, matchdays, matches, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Calendario" };
export const dynamic = "force-dynamic";

const STAGE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

export default async function CalendarPage() {
  const [days, matchRows, allTeams, allGroups] = await Promise.all([
    db
      .select()
      .from(matchdays)
      .orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt)),
    db.select().from(matches).orderBy(asc(matches.scheduledAt)),
    db.select().from(teams),
    db.select().from(groups),
  ]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const groupById = new Map(allGroups.map((g) => [g.id, g]));
  const matchesByDay = new Map<number | null, typeof matchRows>();
  for (const m of matchRows) {
    const arr = matchesByDay.get(m.matchdayId) ?? [];
    arr.push(m);
    matchesByDay.set(m.matchdayId, arr);
  }

  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Mundial 2026"
        title="Calendario"
        description="104 partidos. 39 días."
      />
      {days.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Calendario aún sin cargar"
          description="Pendiente."
        />
      ) : (
        <div className="space-y-12">
          {days.map((d) => {
            const dayMatches = matchesByDay.get(d.id) ?? [];
            return (
              <section key={d.id} className="space-y-4">
                <header className="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--color-border)] pb-3">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-5xl tracking-tight text-[var(--color-arena)] glow-arena">
                      {d.orderIndex.toString().padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                        {STAGE_LABEL[d.stage] ?? d.stage}
                      </p>
                      <h2 className="font-display text-3xl leading-tight tracking-tight">
                        {d.name}
                      </h2>
                    </div>
                  </div>
                  <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                    Cierre predicción · {formatDateTime(d.predictionDeadlineAt)}
                  </p>
                </header>

                <div className="grid gap-3 sm:grid-cols-2">
                  {dayMatches.length === 0 ? (
                    <p className="col-span-full font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                      Sin partidos cargados en esta jornada.
                    </p>
                  ) : (
                    dayMatches.map((m) => {
                      const home = m.homeTeamId ? teamById.get(m.homeTeamId) : null;
                      const away = m.awayTeamId ? teamById.get(m.awayTeamId) : null;
                      const groupCode =
                        m.stage === "group" && home?.groupId
                          ? groupById.get(home.groupId)?.code ?? null
                          : null;
                      return (
                        <MatchCard
                          key={m.id}
                          m={m}
                          home={home}
                          away={away}
                          groupCode={groupCode}
                        />
                      );
                    })
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

type MatchRow = {
  id: number;
  code: string;
  scheduledAt: Date;
  status: "scheduled" | "live" | "finished";
  homeScore: number | null;
  awayScore: number | null;
  venue: string | null;
};

function MatchCard({
  m,
  home,
  away,
  groupCode,
}: {
  m: MatchRow;
  home: { name: string; code: string; flagUrl: string | null } | null | undefined;
  away: { name: string; code: string; flagUrl: string | null } | null | undefined;
  groupCode: string | null;
}) {
  const status =
    m.status === "finished" ? "FINAL" : m.status === "live" ? "EN VIVO" : "PROGRAMADO";
  return (
    <Link
      href={`/partido/${m.id}`}
      className="group relative block overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-all hover:-translate-y-0.5 hover:border-[var(--color-arena)]/40 hover:shadow-[var(--shadow-elev-2)]"
    >
      {/* Top bar — match code + status */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2">
        <span className="flex flex-wrap items-center gap-2 font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
          <span>{m.code}</span>
          {groupCode ? (
            <span className="rounded-sm border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 py-0.5 text-[0.6rem] tracking-[0.18em] text-[var(--color-arena)]">
              Grupo {groupCode}
            </span>
          ) : null}
          <span className="opacity-60">·</span>
          <span>
            {formatDateTime(m.scheduledAt, {
              weekday: "short",
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </span>
        <Badge
          variant={
            m.status === "finished" ? "success" : m.status === "live" ? "warning" : "outline"
          }
        >
          {status}
        </Badge>
      </div>

      <div className="space-y-3 p-4">
        <TeamRow team={home} score={m.homeScore} status={m.status} />
        <TeamRow team={away} score={m.awayScore} status={m.status} />
        {m.venue ? (
          <p className="border-t border-dashed border-[var(--color-border)] pt-2 font-editorial text-xs italic text-[var(--color-muted-foreground)]">
            {m.venue}
          </p>
        ) : null}
      </div>
    </Link>
  );
}

function TeamRow({
  team,
  score,
  status,
}: {
  team: { name: string; code: string; flagUrl: string | null } | null | undefined;
  score: number | null;
  status: "scheduled" | "live" | "finished";
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <TeamFlag code={team?.code} size={28} />
        <div className="min-w-0">
          <p className="truncate font-display text-base leading-none tracking-tight">
            {team?.name ?? "TBD"}
          </p>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            {team?.code ?? "—"}
          </p>
        </div>
      </div>
      <span
        className={`font-display tabular text-3xl tracking-tight ${
          status === "live" ? "text-[var(--color-arena)] glow-arena" : ""
        }`}
      >
        {score != null ? score : <span className="text-[var(--color-muted-foreground)]">·</span>}
      </span>
    </div>
  );
}
