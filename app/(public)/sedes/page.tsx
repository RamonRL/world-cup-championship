import Link from "next/link";
import { MapPin } from "lucide-react";
import { isNotNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { matches } from "@/lib/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Badge } from "@/components/ui/badge";
import { BreadcrumbLD } from "@/components/seo/jsonld";

export const metadata = {
  title: "Sedes",
  description:
    "Las 16 sedes oficiales del Mundial 2026 en Estados Unidos, Canadá y México. Estadios, ciudades y partidos asignados.",
  alternates: { canonical: "/sedes" },
  openGraph: {
    title: "Sedes · Mundial 2026",
    description:
      "Las 16 sedes del Mundial 2026 repartidas entre Estados Unidos, Canadá y México.",
    url: "/sedes",
  },
};

export default async function VenuesPage() {
  // Agregamos por venue contando partidos. La tabla de matches incluye el
  // venue como text, así que sumamos por DISTINCT venue. Se enriquecerá si
  // en el futuro se añade tabla `venues` con lat/long y capacidad.
  const rows = await db
    .select({
      venue: matches.venue,
      count: sql<number>`count(*)::int`,
    })
    .from(matches)
    .where(isNotNull(matches.venue))
    .groupBy(matches.venue)
    .orderBy(sql`count(*) desc`);

  return (
    <div className="space-y-10">
      <BreadcrumbLD
        items={[
          { name: "Inicio", href: "/" },
          { name: "Sedes", href: "/sedes" },
        ]}
      />
      <PageHeader
        eyebrow="Mundial 2026"
        title="Las 16 sedes"
        description="Once estadios en Estados Unidos, tres en México y dos en Canadá. La final, en Nueva York-NJ. La inauguración, en Ciudad de México."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<MapPin className="size-5" />}
          title="Sedes pendientes de asignar"
          description="El fixture oficial todavía no marca estadios para todos los partidos."
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <article
              key={r.venue ?? ""}
              className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]"
            >
              <header className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] bg-[var(--color-surface-2)]/50 px-4 py-2">
                <span className="flex items-center gap-2 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
                  <MapPin className="size-3" />
                  Sede
                </span>
                <Badge variant="outline" className="text-[0.55rem]">
                  {r.count} {r.count === 1 ? "partido" : "partidos"}
                </Badge>
              </header>
              <div className="p-5">
                <h2 className="font-display text-xl tracking-tight">{r.venue}</h2>
                <p className="pt-1 font-editorial text-sm italic text-[var(--color-muted-foreground)]">
                  Sede oficial del Mundial 2026.
                </p>
                <Link
                  href={`/calendario?venue=${encodeURIComponent(r.venue ?? "")}`}
                  className="mt-3 inline-flex items-center gap-1.5 font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-arena)]"
                >
                  Ver partidos →
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
