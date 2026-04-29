"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, NAV_ITEMS, type NavItem } from "./nav-data";

type Props = { isAdmin: boolean };

export function Sidebar({ isAdmin }: Props) {
  const pathname = usePathname();
  const main = NAV_ITEMS.filter((i) => i.group === "main");
  const preds = NAV_ITEMS.filter((i) => i.group === "predicciones");
  const social = NAV_ITEMS.filter((i) => i.group === "social");
  const admin = isAdmin ? ADMIN_NAV : [];

  return (
    <aside className="hidden w-60 shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
      <div className="sticky top-0 flex h-dvh flex-col">
        <Link href="/dashboard" className="flex items-center gap-2 px-4 py-5">
          <span className="grid size-9 place-items-center rounded-md bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
            <Trophy className="size-4" />
          </span>
          <span>
            <span className="block font-display text-lg leading-none">Mundial 26</span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
              Quiniela
            </span>
          </span>
        </Link>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-2">
          <NavGroup title="Torneo" items={main} pathname={pathname} />
          <NavGroup title="Predicciones" items={preds} pathname={pathname} />
          <NavGroup title="Comunidad" items={social} pathname={pathname} />
          {admin.length > 0 ? (
            <NavGroup title="Admin" items={admin} pathname={pathname} />
          ) : null}
        </nav>
      </div>
    </aside>
  );
}

function NavGroup({
  title,
  items,
  pathname,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
}) {
  return (
    <div className="space-y-1">
      <p className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
        {title}
      </p>
      {items.map((item) => {
        const active =
          item.href === "/dashboard"
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
    </div>
  );
}
