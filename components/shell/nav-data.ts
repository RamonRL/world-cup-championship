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
};

type BuildOptions = {
  /**
   * Si la liga activa del usuario es privada, mostramos el item "Mi
   * Quiniela" (gestión de la liga: miembros, código, invite link). En la
   * pública no tiene sentido — no hay nada que gestionar.
   */
  showMyLeague?: boolean;
};

export function buildNavItems(myId: string, opts: BuildOptions = {}): NavItem[] {
  const items: NavItem[] = [
    { href: "/dashboard", label: "Inicio", icon: Home, group: "main", primaryMobile: true },
    { href: "/calendario", label: "Calendario", icon: CalendarDays, group: "main" },
    { href: "/grupos", label: "Grupos", icon: Users, group: "main" },
    { href: "/bracket", label: "Bracket", icon: Swords, group: "main" },
    { href: "/goleadores", label: "Goleadores", icon: Target, group: "main" },
    { href: "/estadisticas", label: "Estadísticas", icon: BarChart3, group: "main" },
    {
      href: "/predicciones",
      label: "Mis predicciones",
      mobileLabel: "Predicciones",
      icon: ClipboardList,
      group: "predicciones",
      primaryMobile: true,
    },
    {
      href: `/ranking/${myId}`,
      label: "Mis resultados",
      icon: CircleUser,
      group: "predicciones",
    },
  ];
  if (opts.showMyLeague) {
    items.push({
      href: "/mi-quiniela",
      label: "Mi Quiniela",
      icon: UsersRound,
      group: "predicciones",
    });
  }
  items.push(
    {
      href: "/ranking",
      label: "Ranking",
      icon: ListOrdered,
      group: "social",
      primaryMobile: true,
    },
    { href: "/comparar", label: "Comparar", icon: Trophy, group: "social" },
    { href: "/chat", label: "Chat", icon: MessagesSquare, group: "social" },
  );
  return items;
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: Settings2, group: "main" },
];
