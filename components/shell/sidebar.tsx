"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, buildNavItems, type NavItem } from "./nav-data";

type Props = {
  isAdmin: boolean;
  myId: string;
  pendingCount?: number;
  defaultCollapsed?: boolean;
};

// Cookie name compartido con el server-side reader del layout para que el
// estado de la sidebar persista entre navegaciones sin flicker.
const COLLAPSE_COOKIE = "sidebar_collapsed";

export function Sidebar({
  isAdmin,
  myId,
  pendingCount = 0,
  defaultCollapsed = false,
}: Props) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const items = buildNavItems(myId);
  const main = items.filter((i) => i.group === "main");
  const preds = items.filter((i) => i.group === "predicciones");
  const social = items.filter((i) => i.group === "social");
  const admin = isAdmin ? ADMIN_NAV : [];
  const activeHref = pickActiveHref(pathname, [...items, ...admin]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    document.cookie = `${COLLAPSE_COOKIE}=${next ? "1" : "0"};path=/;max-age=31536000;samesite=lax`;
  };

  return (
    <aside
      className={cn(
        "hidden shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 lg:block",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="sticky top-0 flex h-dvh flex-col">
        {/* Header — logo + título + toggle (en collapsed solo el logo) */}
        <div
          className={cn(
            "flex items-center border-b border-[var(--color-border)]",
            collapsed ? "flex-col gap-3 px-2 py-4" : "gap-3 px-5 py-6",
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center transition-opacity hover:opacity-80",
              collapsed ? "justify-center" : "min-w-0 flex-1",
            )}
            aria-label="Quiniela Mundial"
            title={collapsed ? "Inicio" : undefined}
          >
            {collapsed ? (
              // Colapsado: mark cuadrado de Quiniela Mundial
              // (favicon/croppedalpha.png).
              <Image
                src="/qm-mark.png"
                alt="Quiniela Mundial"
                width={940}
                height={973}
                priority
                className="size-12 object-contain"
              />
            ) : (
              // Expandido: logo horizontal "Quiniela Mundial".
              <Image
                src="/hlogo.png"
                alt="Quiniela Mundial"
                width={1919}
                height={660}
                priority
                className="h-12 w-auto"
              />
            )}
          </Link>
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expandir barra lateral" : "Contraer barra lateral"}
            title={collapsed ? "Expandir" : "Contraer"}
            className="grid size-8 shrink-0 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)] transition hover:border-[var(--color-arena)]/40 hover:text-[var(--color-foreground)]"
          >
            {collapsed ? (
              <ChevronsRight className="size-4" />
            ) : (
              <ChevronsLeft className="size-4" />
            )}
          </button>
        </div>

        <nav
          className={cn(
            "flex-1 overflow-y-auto",
            collapsed ? "space-y-2 px-2 py-4" : "space-y-7 px-3 py-5",
          )}
        >
          <NavGroup
            title="Torneo"
            items={main}
            activeHref={activeHref}
            collapsed={collapsed}
          />
          <NavGroup
            title="Predicciones"
            items={preds}
            activeHref={activeHref}
            badgeFor="/predicciones"
            badgeCount={pendingCount}
            collapsed={collapsed}
          />
          <NavGroup
            title="Comunidad"
            items={social}
            activeHref={activeHref}
            collapsed={collapsed}
          />
          {admin.length > 0 ? (
            <NavGroup
              title="Admin"
              items={admin}
              activeHref={activeHref}
              collapsed={collapsed}
            />
          ) : null}
        </nav>
        {!collapsed ? (
          <div className="border-t border-[var(--color-border)] px-5 py-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Canadá · México · USA
            </p>
            <p className="font-display text-base tracking-tight">11 jun — 19 jul</p>
          </div>
        ) : null}
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  activeHref,
  badgeFor,
  badgeCount = 0,
  collapsed,
}: {
  title: string;
  items: NavItem[];
  activeHref: string | null;
  badgeFor?: string;
  badgeCount?: number;
  collapsed: boolean;
}) {
  return (
    <div className={collapsed ? "space-y-1" : "space-y-1"}>
      {collapsed ? (
        <span
          aria-hidden
          className="mx-auto mb-1 block h-px w-6 bg-[var(--color-border)]"
        />
      ) : (
        <div className="flex items-center gap-2 px-2 pb-2">
          <span className="h-px w-3 bg-[var(--color-arena)]" />
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            {title}
          </p>
        </div>
      )}
      {items.map((item) => {
        const active = item.href === activeHref;
        const showBadge = badgeFor === item.href && badgeCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-label={collapsed ? item.label : undefined}
            className={cn(
              "group relative flex items-center transition",
              collapsed
                ? cn(
                    "mx-auto size-11 justify-center rounded-md",
                    active
                      ? "bg-[color-mix(in_oklch,var(--color-arena)_12%,transparent)] ring-1 ring-[var(--color-arena)]/40"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]",
                  )
                : cn(
                    "gap-3 rounded-md px-3 py-2.5 text-[0.95rem]",
                    active
                      ? "bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] font-semibold text-[var(--color-foreground)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]",
                  ),
            )}
          >
            {active && !collapsed ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[var(--color-arena)]"
              />
            ) : null}
            <item.icon
              className={cn("size-5", active ? "text-[var(--color-arena)]" : "")}
            />
            {!collapsed ? <span>{item.label}</span> : null}
            {showBadge ? (
              <span
                className={cn(
                  "grid place-items-center rounded-full bg-[var(--color-arena)] font-mono font-semibold tabular text-white",
                  collapsed
                    ? "absolute right-0.5 top-0.5 size-4 px-0 text-[0.5rem]"
                    : "ml-auto min-w-[1.25rem] px-1.5 text-[0.6rem]",
                )}
              >
                {badgeCount > 99 ? "99+" : badgeCount}
              </span>
            ) : null}
          </Link>
        );
      })}
    </div>
  );
}

// Resuelve el item "activo" eligiendo el match más largo. Necesario porque
// "/ranking/[myId]" (Mis resultados) tiene que ganarle a "/ranking" (Ranking)
// cuando el usuario está en su propio perfil, y al revés cuando está en
// otro perfil ningún hijo gana — vuelve a marcarse "/ranking".
function pickActiveHref(pathname: string, items: NavItem[]): string | null {
  let best: { href: string; len: number } | null = null;
  for (const item of items) {
    const matches =
      item.href === "/dashboard"
        ? pathname === item.href
        : pathname === item.href || pathname.startsWith(`${item.href}/`);
    if (!matches) continue;
    if (!best || item.href.length > best.len) {
      best = { href: item.href, len: item.href.length };
    }
  }
  return best?.href ?? null;
}
