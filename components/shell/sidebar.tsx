"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, NAV_ITEMS, type NavItem } from "./nav-data";

type Props = { isAdmin: boolean; pendingCount?: number };

export function Sidebar({ isAdmin, pendingCount = 0 }: Props) {
  const pathname = usePathname();
  const main = NAV_ITEMS.filter((i) => i.group === "main");
  const preds = NAV_ITEMS.filter((i) => i.group === "predicciones");
  const social = NAV_ITEMS.filter((i) => i.group === "social");
  const admin = isAdmin ? ADMIN_NAV : [];

  return (
    <aside className="hidden w-64 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-6 transition-colors hover:bg-[var(--color-surface-2)]"
        >
          <span className="grid size-10 place-items-center rounded-md bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]">
            <Trophy className="size-4" />
          </span>
          <span className="leading-tight">
            <span className="block font-display text-2xl tracking-tight">Mundial 26</span>
            <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              La Quiniela
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-7 overflow-y-auto px-3 py-5">
          <NavGroup title="Torneo" items={main} pathname={pathname} />
          <NavGroup
            title="Predicciones"
            items={preds}
            pathname={pathname}
            badgeFor="/predicciones"
            badgeCount={pendingCount}
          />
          <NavGroup title="Comunidad" items={social} pathname={pathname} />
          {admin.length > 0 ? (
            <NavGroup title="Admin" items={admin} pathname={pathname} />
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
  pathname,
  badgeFor,
  badgeCount = 0,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
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
        const active =
          item.href === "/dashboard"
            ? pathname === item.href
            : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
