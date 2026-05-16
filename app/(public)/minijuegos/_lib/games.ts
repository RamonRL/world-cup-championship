import type { LucideIcon } from "lucide-react";
import { Flag, Users2 } from "lucide-react";

export type MinigameDef = {
  slug: string;
  gameKey: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  /** "live" → jugable; "soon" → solo se muestra como teaser. */
  status: "live" | "soon";
};

export const MINIGAMES: MinigameDef[] = [
  {
    slug: "quien-es-quien",
    gameKey: "quien-es-quien",
    name: "¿Quién es quién?",
    tagline: "60 s · caras y nombres",
    description:
      "Van apareciendo caras de jugadores. Elige el nombre correcto entre cuatro opciones. Tu puntuación es el número de aciertos en un minuto.",
    icon: Users2,
    status: "live",
  },
  {
    slug: "adivina-la-bandera",
    gameKey: "adivina-la-bandera",
    name: "Adivina la bandera",
    tagline: "Próximamente",
    description:
      "Misma mecánica que ¿Quién es quién?, pero con banderas de selecciones del Mundial.",
    icon: Flag,
    status: "soon",
  },
];

export function findGame(slug: string): MinigameDef | null {
  return MINIGAMES.find((g) => g.slug === slug) ?? null;
}
