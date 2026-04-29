import {
  BarChart3,
  CalendarDays,
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
  icon: LucideIcon;
  group: "main" | "predicciones" | "social";
  primaryMobile?: boolean;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home, group: "main", primaryMobile: true },
  { href: "/calendario", label: "Calendario", icon: CalendarDays, group: "main" },
  { href: "/grupos", label: "Grupos", icon: Users, group: "main" },
  { href: "/bracket", label: "Bracket", icon: Swords, group: "main" },
  { href: "/goleadores", label: "Goleadores", icon: Target, group: "main" },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3, group: "main" },
  {
    href: "/predicciones",
    label: "Mis predicciones",
    icon: ClipboardList,
    group: "predicciones",
    primaryMobile: true,
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

export const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Admin", icon: Settings2, group: "main" },
];
