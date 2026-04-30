import Link from "next/link";
import {
  ArrowUpRight,
  CalendarDays,
  ClipboardList,
  Sparkles,
  Swords,
  Target,
  Users,
} from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Mis predicciones" };

const sections = [
  {
    href: "/predicciones/grupos",
    cat: "01",
    label: "Posiciones",
    sub: "Fase de grupos",
    icon: Users,
    description:
      "Ordena las 4 selecciones de cada grupo del 1º al 4º. 3 pts exacto, 1 pt adyacente, +1 si aciertas top-2 en cualquier orden.",
    pts: "3 · 1 · +1",
  },
  {
    href: "/predicciones/bracket",
    cat: "02",
    label: "Bracket",
    sub: "Eliminatoria",
    icon: Swords,
    description:
      "Al cerrar la fase de grupos. Quién avanza con los 32 clasificados: 2 → 4 → 7 → 10 → 20 pts hasta el campeón.",
    pts: "2 → 20",
  },
  {
    href: "/predicciones/goleador-torneo",
    cat: "03",
    label: "Bota de Oro",
    sub: "Máximo goleador",
    icon: Target,
    description: "Tu candidato al máximo goleador del torneo. 15 pts si aciertas; 5 si queda 2º o 3º; 2 si queda en el top 5.",
    pts: "15 · 5 · 2",
  },
  {
    href: "/predicciones/jornada",
    cat: "04",
    label: "Resultados",
    sub: "Por jornada",
    icon: CalendarDays,
    description:
      "Marcadores exactos. 5 pts si clavas el resultado, 2 pts si aciertas ganador. En knockout, +3 por clasificado y +2 si va a penaltis.",
    pts: "5 · 2 · +3",
  },
  {
    href: "/predicciones/partido",
    cat: "05",
    label: "Goleador",
    sub: "Por partido",
    icon: ClipboardList,
    description:
      "Antes de cada partido eliges un jugador que marcará. 4 pts si anota; +2 extra si es el primer gol del partido.",
    pts: "4 · +2",
  },
  {
    href: "/predicciones/especiales",
    cat: "06",
    label: "Especiales",
    sub: "Premios y caprichos",
    icon: Sparkles,
    description:
      "Balón de Oro, Guante de Oro, gol >6 en grupos, anfitrión más lejos, África en semis…",
    pts: "3 · 4 · 6 · 8",
  },
];

export default function PrediccionesHub() {
  return (
    <div className="space-y-10">
      <PageHeader
        eyebrow="Tus apuestas"
        title="Predicciones"
        description="Las seis categorías de la quiniela. Tus picks quedan privados hasta el inicio del partido o ronda."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s, i) => (
          <Link key={s.href} href={s.href} className="group block">
            <article className="relative h-full overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-arena)]/50 hover:shadow-[var(--shadow-elev-2)]">
              {/* Category number — huge, ghost behind content */}
              <span
                aria-hidden
                className="pointer-events-none absolute -right-4 -top-6 select-none font-display text-[8rem] leading-none text-[var(--color-foreground)] opacity-[0.04]"
              >
                {s.cat}
              </span>

              <div className="relative space-y-5">
                <header className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-arena)] transition-colors group-hover:bg-[var(--color-arena)] group-hover:text-white">
                      <s.icon className="size-5" />
                    </span>
                    <div>
                      <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                        Cat. {s.cat} · {s.sub}
                      </p>
                      <h2 className="font-display text-3xl tracking-tight">{s.label}</h2>
                    </div>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 text-[var(--color-muted-foreground)] transition-transform group-hover:translate-x-1 group-hover:-translate-y-1 group-hover:text-[var(--color-arena)]" />
                </header>

                <p className="font-editorial text-base italic leading-relaxed text-[var(--color-muted-foreground)]">
                  {s.description}
                </p>

                <footer className="flex items-center justify-between border-t border-dashed border-[var(--color-border)] pt-4">
                  <span className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                    Puntos
                  </span>
                  <span className="font-display tabular text-lg tracking-tight">{s.pts}</span>
                </footer>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
