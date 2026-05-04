import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Goal, MapPin } from "lucide-react";
import { asc, eq, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, matches, players, teams } from "@/lib/db/schema";
import { TeamFlag } from "@/components/brand/team-flag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shell/empty-state";
import { formatDateTime } from "@/lib/utils";
import { BreadcrumbLD } from "@/components/seo/jsonld";

const STAGE_LABEL: Record<string, string> = {
  group: "Fase de grupos",
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinales",
  third: "Tercer puesto",
  final: "Final",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.code, upper))
    .limit(1);
  if (!team) return { title: "Selección" };
  return {
    title: team.name,
    description: `${team.name} en el Mundial 2026: grupo, calendario de partidos, plantilla y goleadores.`,
    alternates: { canonical: `/equipos/${upper}` },
    openGraph: {
      title: `${team.name} · Mundial 2026`,
      description: `Calendario y plantilla de ${team.name} en el Mundial 2026.`,
      url: `/equipos/${upper}`,
    },
  };
}

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const upper = code.toUpperCase();
  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.code, upper))
    .limit(1);
  if (!team) notFound();

  const [group] = team.groupId
    ? await db.select().from(groups).where(eq(groups.id, team.groupId)).limit(1)
    : [];

  const [teamMatches, squad] = await Promise.all([
    db
      .select()
      .from(matches)
      .where(or(eq(matches.homeTeamId, team.id), eq(matches.awayTeamId, team.id)))
      .orderBy(asc(matches.scheduledAt)),
    db
      .select()
      .from(players)
      .where(eq(players.teamId, team.id))
      .orderBy(asc(players.jerseyNumber)),
  ]);

  // Reuse opponent rows for showing the rival in each match card.
  const oppIds = Array.from(
    new Set(
      teamMatches.flatMap((m) => [m.homeTeamId, m.awayTeamId]).filter(
        (x): x is number => x != null && x !== team.id,
      ),
    ),
  );
  const oppRows = oppIds.length > 0
    ? await db.select().from(teams).where(or(...oppIds.map((id) => eq(teams.id, id))))
    : [];
  const oppById = new Map(oppRows.map((t) => [t.id, t]));

  return (
    <div className="space-y-10">
      <BreadcrumbLD
        items={[
          { name: "Inicio", href: "/" },
          { name: "Selecciones", href: "/equipos" },
          { name: team.name, href: `/equipos/${team.code}` },
        ]}
      />

      <Button asChild variant="ghost" size="sm" className="px-0 text-[var(--color-muted-foreground)]">
        <Link href="/equipos">
          <ArrowLeft />
          Volver a selecciones
        </Link>
      </Button>

      <header className="flex flex-wrap items-center gap-5 border-b border-[var(--color-border)] pb-8">
        <span className="shrink-0">
          <TeamFlag code={team.code} size={96} />
        </span>
        <div className="space-y-2">
          <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Selección
          </p>
          <h1 className="font-display text-5xl leading-[0.92] tracking-tight sm:text-6xl">
            {team.name}
          </h1>
          {group ? (
            <p className="font-editorial text-base italic text-[var(--color-muted-foreground)]">
              Encuadrada en el{" "}
              <Link
                href={`/grupos/${group.code}`}
                className="text-[var(--color-arena)] underline-offset-2 hover:underline"
              >
                Grupo {group.code}
              </Link>{" "}
              del Mundial 2026.
            </p>
          ) : null}
        </div>
      </header>

      {/* Calendario */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <CalendarDays className="size-4 text-[var(--color-arena)]" />
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Calendario en el torneo
          </h2>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </header>
        {teamMatches.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-5" />}
            title="Sin partidos asignados"
            description="Pendiente del fixture oficial FIFA."
          />
        ) : (
          <ul className="space-y-2">
            {teamMatches.map((m) => {
              const isHome = m.homeTeamId === team.id;
              const oppId = isHome ? m.awayTeamId : m.homeTeamId;
              const opp = oppId ? oppById.get(oppId) : null;
              return (
                <li key={m.id}>
                  <Link
                    href={`/partido/${m.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 transition hover:border-[var(--color-arena)]/40"
                  >
                    <span className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[0.55rem]">
                        {STAGE_LABEL[m.stage] ?? m.stage}
                      </Badge>
                      <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        {m.code}
                      </span>
                    </span>
                    <span className="flex min-w-0 flex-1 items-center gap-2 sm:ml-3">
                      <span className="text-sm font-medium">{isHome ? "vs" : "@"}</span>
                      <TeamFlag code={opp?.code} size={20} />
                      <span className="truncate text-sm font-medium">{opp?.name ?? "TBD"}</span>
                    </span>
                    <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                      {formatDateTime(m.scheduledAt, {
                        weekday: "short",
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {m.venue ? (
                      <span className="hidden items-center gap-1 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)] sm:inline-flex">
                        <MapPin className="size-3" />
                        {m.venue}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Plantilla */}
      <section className="space-y-4">
        <header className="flex items-center gap-3">
          <Goal className="size-4 text-[var(--color-arena)]" />
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Plantilla
          </h2>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </header>
        {squad.length === 0 ? (
          <EmptyState
            icon={<Goal className="size-5" />}
            title="Plantilla aún por definir"
            description="Las listas finales de 26 jugadores se confirman semanas antes del torneo."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {squad.map((p) => (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2"
              >
                <span className="grid size-8 place-items-center rounded-md bg-[var(--color-surface-2)] font-display tabular text-sm">
                  {p.jerseyNumber ?? "—"}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  {p.position ? (
                    <p className="font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                      {p.position}
                    </p>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
