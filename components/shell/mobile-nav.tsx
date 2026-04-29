"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { ADMIN_NAV, NAV_ITEMS, type NavItem } from "./nav-data";

type Props = { isAdmin: boolean };

export function MobileBottomNav({ isAdmin }: Props) {
  const pathname = usePathname();
  const primary = NAV_ITEMS.filter((i) => i.primaryMobile);
  const overflow = NAV_ITEMS.filter((i) => !i.primaryMobile).concat(isAdmin ? ADMIN_NAV : []);

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-surface)_92%,transparent)] backdrop-blur-md lg:hidden">
        {primary.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium transition",
                active
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-muted-foreground)]",
              )}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <Sheet>
          <SheetTrigger className="flex flex-1 flex-col items-center gap-1 py-2 text-[11px] font-medium text-[var(--color-muted-foreground)]">
            <Menu className="size-5" />
            <span>Más</span>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80dvh] rounded-t-xl">
            <SheetHeader>
              <SheetTitle>Navegación</SheetTitle>
              <SheetDescription>Todas las secciones</SheetDescription>
            </SheetHeader>
            <Separator className="my-4" />
            <div className="grid grid-cols-2 gap-2">
              {overflow.map((item) => (
                <OverflowLink key={item.href} item={item} pathname={pathname} />
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </>
  );
}

function OverflowLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm font-medium",
        active && "border-[var(--color-primary)] text-[var(--color-primary)]",
      )}
    >
      <item.icon className="size-4" />
      <span>{item.label}</span>
    </Link>
  );
}
