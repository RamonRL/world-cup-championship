import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { matchdays, matches, teams } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Calendario" };

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
  const [days, matchRows, allTeams] = await Promise.all([
    db
      .select()
      .from(matchdays)
      .orderBy(asc(matchdays.orderIndex), asc(matchdays.predictionDeadlineAt)),
    db.select().from(matches).orderBy(asc(matches.scheduledAt)),
    db.select().from(teams),
  ]);
  const teamById = new Map(allTeams.map((t) => [t.id, t]));
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
        description="104 partidos. Pulsa cada uno para ver detalle, alineaciones y comentarios del hilo."
      />
      {days.length === 0 ? (
        <EmptyState
          icon={<CalendarDays className="size-5" />}
          title="Calendario aún sin cargar"
          description="El admin todavía no ha publicado las jornadas."
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
                      return <MatchCard key={m.id} m={m} home={home} away={away} />;
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
}: {
  m: MatchRow;
  home: { name: string; code: string; flagUrl: string | null } | null | undefined;
  away: { name: string; code: string; flagUrl: string | null } | null | undefined;
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
        <span className="font-mono text-[0.65rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
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
        <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          {team?.flagUrl ? (
            <Image src={team.flagUrl} alt={team.code} width={28} height={28} />
          ) : null}
        </span>
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
