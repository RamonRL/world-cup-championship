import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  ClipboardList,
  Sparkles,
  Swords,
  Target,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shell/page-header";

export const metadata = { title: "Mis predicciones" };

const sections = [
  {
    href: "/predicciones/grupos",
    label: "Posiciones de grupo",
    icon: Users,
    description:
      "Ordena las 4 selecciones de cada grupo del 1º al 4º. 3 pts exacto, 1 pt adyacente, +1 si aciertas top-2 en cualquier orden.",
  },
  {
    href: "/predicciones/bracket",
    label: "Bracket eliminatorio",
    icon: Swords,
    description:
      "Predice quién pasa cada ronda: 2 → 4 → 7 → 10 → 20 puntos por equipo correcto desde 1/16 hasta el campeón.",
  },
  {
    href: "/predicciones/goleador-torneo",
    label: "Bota de Oro",
    icon: Target,
    description: "Tu candidato al máximo goleador del torneo: 15 / 5 / 2 puntos según posición.",
  },
  {
    href: "/predicciones/especiales",
    label: "Predicciones especiales",
    icon: Sparkles,
    description:
      "7 preguntas adicionales: Balón de Oro, Guante de Oro, África en semis, anfitrión más lejos…",
  },
  {
    href: "/predicciones/jornada",
    label: "Resultados por jornada",
    icon: CalendarDays,
    description:
      "Marcadores exactos antes de cada jornada. 5 pts exacto, 2 pts ganador correcto. Cierre 24 h antes.",
  },
  {
    href: "/predicciones/partido",
    label: "Goleador por partido",
    icon: ClipboardList,
    description: "Antes de cada partido elige un jugador que marcará. 4 pts si marca, +2 si es el primero.",
  },
];

export default function PrediccionesHub() {
  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Tus apuestas"
        title="Predicciones"
        description="Las seis categorías de la quiniela. Las predicciones que envíes son privadas hasta el inicio del partido o ronda al que se refieren."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((s) => (
          <Link key={s.href} href={s.href} className="group">
            <Card className="h-full transition-colors hover:border-[var(--color-primary)]/50">
              <CardHeader className="flex flex-row items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-md bg-[var(--color-primary)]/10 text-[var(--color-primary)]">
                  <s.icon className="size-5" />
                </span>
                <div className="flex-1 space-y-1">
                  <CardTitle className="flex items-center justify-between gap-2 text-base">
                    {s.label}
                    <ArrowRight className="size-4 opacity-50 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
                  </CardTitle>
                  <CardDescription className="text-xs leading-relaxed">
                    {s.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="text-xs text-[var(--color-muted-foreground)]">
                Estado · Pendiente
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
