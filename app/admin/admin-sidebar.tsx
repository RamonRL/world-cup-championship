"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  CalendarRange,
  ClipboardCheck,
  Gauge,
  Goal,
  MessagesSquare,
  ScrollText,
  ShieldCheck,
  Sliders,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/admin", label: "Dashboard", icon: Gauge },
  { href: "/admin/usuarios", label: "Usuarios", icon: UserCheck },
  { href: "/admin/selecciones", label: "Selecciones", icon: Users },
  { href: "/admin/jugadores", label: "Jugadores", icon: Goal },
  { href: "/admin/calendario", label: "Calendario", icon: CalendarRange },
  { href: "/admin/partidos", label: "Resultados", icon: ClipboardCheck },
  { href: "/admin/reglas", label: "Reglas de puntuación", icon: Sliders },
  { href: "/admin/especiales", label: "Predicciones especiales", icon: Sparkles },
  { href: "/admin/operaciones", label: "Operaciones", icon: ShieldCheck },
  { href: "/admin/chat", label: "Moderación", icon: MessagesSquare },
  { href: "/admin/auditoria", label: "Auditoría", icon: ScrollText },
];

export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <div className="flex items-center gap-2 px-4 py-5">
          <span className="grid size-9 place-items-center rounded-md bg-[var(--color-danger)]/15 text-[var(--color-danger)]">
            <ShieldCheck className="size-4" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none">Admin</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
              Panel de control
            </span>
          </span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
          {items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition",
                  active
                    ? "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]",
                )}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-[var(--color-border)] p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft className="size-3.5" />
            Volver a la app
          </Link>
        </div>
      </div>
    </aside>
  );
}
