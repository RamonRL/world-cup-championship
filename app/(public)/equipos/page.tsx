import Link from "next/link";
import { asc } from "drizzle-orm";
import { Globe } from "lucide-react";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { TeamFlag } from "@/components/brand/team-flag";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { BreadcrumbLD } from "@/components/seo/jsonld";

export const metadata = {
  title: "Selecciones",
  description:
    "Las 48 selecciones del Mundial 2026 organizadas por grupo. Banderas, cupos y enlace al detalle de cada combinado nacional.",
  alternates: { canonical: "/equipos" },
  openGraph: {
    title: "Selecciones · Mundial 2026",
    description:
      "Las 48 selecciones del Mundial 2026 — primera edición ampliada con CONCACAF, UEFA, CONMEBOL, AFC, CAF y OFC.",
    url: "/equipos",
  },
};

export default async function TeamsPage() {
  const [allGroups, allTeams] = await Promise.all([
    db.select().from(groups).orderBy(asc(groups.code)),
    db.select().from(teams).orderBy(asc(teams.name)),
  ]);
  const teamsByGroup = new Map<number, typeof allTeams>();
  for (const t of allTeams) {
    if (t.groupId == null) continue;
    const arr = teamsByGroup.get(t.groupId) ?? [];
    arr.push(t);
    teamsByGroup.set(t.groupId, arr);
  }

  return (
    <div className="space-y-10">
      <BreadcrumbLD
        items={[
          { name: "Inicio", href: "/" },
          { name: "Selecciones", href: "/equipos" },
        ]}
      />
      <PageHeader
        eyebrow="Mundial 2026"
        title="48 selecciones"
        description="Primera edición ampliada del Mundial. 48 selecciones repartidas en 12 grupos, con representantes de las 6 confederaciones."
      />

      {allTeams.length === 0 ? (
        <EmptyState
          icon={<Globe className="size-5" />}
          title="Selecciones aún sin cargar"
          description="Pendiente."
        />
      ) : (
        <div className="space-y-10">
          {allGroups.map((g) => {
            const groupTeams = (teamsByGroup.get(g.id) ?? []).sort((a, b) =>
              a.name.localeCompare(b.name),
            );
            if (groupTeams.length === 0) return null;
            return (
              <section key={g.id} className="space-y-3">
                <header className="flex items-baseline gap-3 border-b border-[var(--color-border)] pb-2">
                  <span className="font-display text-3xl tracking-tight text-[var(--color-arena)] glow-arena">
                    {g.code}
                  </span>
                  <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                    Grupo {g.code}
                  </p>
                </header>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {groupTeams.map((t) => (
                    <Link
                      key={t.id}
                      href={`/equipos/${t.code}`}
                      className="group flex items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 transition hover:border-[var(--color-arena)]/40"
                    >
                      <TeamFlag code={t.code} size={28} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.name}</p>
                        <p className="font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                          {t.code}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
