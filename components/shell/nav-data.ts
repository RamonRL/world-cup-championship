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

export function buildNavItems(myId: string): NavItem[] {
  return [
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
    {
      href: "/ranking",
      label: "Ranking",
      icon: ListOrdered,
      group: "social",
      primaryMobile: true,
    },
    { href: "/comparar", label: "Comparar", icon: Trophy, group: "social" },
    { href: "/chat", label: "Chat", icon: MessagesSquare, group: "social" },
  ];
}

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: Settings2, group: "main" },
];
