import {
  BarChart3,
  CalendarDays,
  CircleUser,
  ClipboardList,
  Home,
  ListOrdered,
  MessagesSquare,
  Settings2,
  Swords,
  Target,
  Trophy,
  Users,
  UsersRound,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  mobileLabel?: string;
  icon: LucideIcon;
  group: "main" | "predicciones" | "social";
  primaryMobile?: boolean;
  /** Si true, el item solo se muestra a usuarios con sesión activa. */
  requiresAuth?: boolean;
};

type BuildOptions = {
  /**
   * Si la liga activa del usuario es privada, mostramos el item "Mi
   * Quiniela" (gestión de la liga: miembros, código, invite link). En la
   * pública no tiene sentido — no hay nada que gestionar.
   */
  showMyLeague?: boolean;
  /**
   * Sesión activa. Si false (visitante público), filtramos los items con
   * requiresAuth para que solo se vean los públicos del torneo.
   */
  isAuthenticated?: boolean;
};

export function buildNavItems(myId: string, opts: BuildOptions = {}): NavItem[] {
  const all: NavItem[] = [
    {
      href: "/dashboard",
      label: "Inicio",
      icon: Home,
      group: "main",
      primaryMobile: true,
      requiresAuth: true,
    },
    { href: "/calendario", label: "Calendario", icon: CalendarDays, group: "main" },
    { href: "/grupos", label: "Grupos", icon: Users, group: "main" },
    { href: "/bracket", label: "Bracket", icon: Swords, group: "main" },
    { href: "/goleadores", label: "Goleadores", icon: Target, group: "main" },
    {
      href: "/estadisticas",
      label: "Estadísticas",
      icon: BarChart3,
      group: "main",
      requiresAuth: true,
    },
    {
      href: "/predicciones",
      label: "Mis predicciones",
      mobileLabel: "Predicciones",
      icon: ClipboardList,
      group: "predicciones",
      primaryMobile: true,
      requiresAuth: true,
    },
    {
      href: `/ranking/${myId}`,
      label: "Mis resultados",
      icon: CircleUser,
      group: "predicciones",
      requiresAuth: true,
    },
  ];
  if (opts.showMyLeague) {
    all.push({
      href: "/mi-quiniela",
      label: "Mi Quiniela",
      icon: UsersRound,
      group: "predicciones",
      requiresAuth: true,
    });
  }
  all.push({
    href: "/ranking",
    label: "Ranking",
    icon: ListOrdered,
    group: "social",
    primaryMobile: true,
    requiresAuth: true,
  });
  // Comparar solo tiene sentido en quinielas privadas (la pública es
  // demasiado masiva como para que comparar predicción a predicción
  // aporte algo). Reusamos el mismo flag que filtra "Mi Quiniela".
  if (opts.showMyLeague) {
    all.push({
      href: "/comparar",
      label: "Comparar",
      icon: Trophy,
      group: "social",
      requiresAuth: true,
    });
  }
  all.push({
    href: "/chat",
    label: "Chat",
    icon: MessagesSquare,
    group: "social",
    requiresAuth: true,
  });
  if (opts.isAuthenticated === false) {
    return all.filter((it) => !it.requiresAuth);
  }
  return all;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: Settings2, group: "main" },
];
