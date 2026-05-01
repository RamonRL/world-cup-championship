"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, buildNavItems, type NavItem } from "./nav-data";

type Props = { isAdmin: boolean; myId: string; pendingCount?: number };

export function Sidebar({ isAdmin, myId, pendingCount = 0 }: Props) {
  const pathname = usePathname();
  const items = buildNavItems(myId);
  const main = items.filter((i) => i.group === "main");
  const preds = items.filter((i) => i.group === "predicciones");
  const social = items.filter((i) => i.group === "social");
  const admin = isAdmin ? ADMIN_NAV : [];
  const activeHref = pickActiveHref(pathname, [...items, ...admin]);

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-6 transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <Image
            src="/logo.png"
            alt="Copa Mundial de la FIFA 2026"
            width={40}
            height={40}
            priority
            className="size-10 rounded-md object-cover shadow-[var(--shadow-arena)]"
          />
          <span className="leading-tight">
            <span className="block font-display text-2xl tracking-tight">Copa Mundial de la FIFA 2026</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              La Quiniela
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          <NavGroup title="Torneo" items={main} activeHref={activeHref} />
          <NavGroup
            title="Predicciones"
            items={preds}
            activeHref={activeHref}
            badgeFor="/predicciones"
            badgeCount={pendingCount}
          />
          <NavGroup title="Comunidad" items={social} activeHref={activeHref} />
          {admin.length > 0 ? (
            <NavGroup title="Admin" items={admin} activeHref={activeHref} />
          ) : null}
        </nav>
        <div className="border-t border-[var(--color-border)] px-5 py-4">
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Canadá · México · USA
          </p>
          <p className="font-display text-base tracking-tight">11 jun — 19 jul</p>
        </div>
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
}: {
  title: string;
  items: NavItem[];
  activeHref: string | null;
  badgeFor?: string;
  badgeCount?: number;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2 px-2 pb-2">
        <span className="h-px w-3 bg-[var(--color-arena)]" />
        <p className="font-mono text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {title}
        </p>
      </div>
      {items.map((item) => {
        const active = item.href === activeHref;
        const showBadge = badgeFor === item.href && badgeCount > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition",
              active
                ? "bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] font-semibold text-[var(--color-foreground)]"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-foreground)]",
            )}
          >
            {active ? (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-[var(--color-arena)]"
              />
            ) : null}
            <item.icon
              className={cn(
                "size-4",
                active ? "text-[var(--color-arena)]" : "",
              )}
            />
            <span>{item.label}</span>
            {showBadge ? (
              <span className="ml-auto grid min-w-[1.25rem] place-items-center rounded-full bg-[var(--color-arena)] px-1.5 font-mono text-[0.6rem] font-semibold tabular text-white">
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
