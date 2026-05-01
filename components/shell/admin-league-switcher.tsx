"use client";

import { Check, ChevronsUpDown, Trophy } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { setLeagueView } from "@/lib/league-actions";

type LeagueLite = {
  id: number;
  name: string;
  isPublic: boolean;
};

export function AdminLeagueSwitcher({
  leagues,
  currentLeagueId,
}: {
  leagues: LeagueLite[];
  currentLeagueId: number | null;
}) {
  const current = leagues.find((l) => l.id === currentLeagueId) ?? null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="hidden items-center gap-2 rounded-md border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] px-2.5 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-arena)] transition hover:border-[var(--color-arena)] sm:inline-flex"
          aria-label="Cambiar liga visible"
        >
          <Trophy className="size-3" />
          <span className="max-w-[18ch] truncate normal-case tracking-normal text-[0.7rem] font-semibold text-[var(--color-foreground)]">
            {current?.name ?? "Liga"}
          </span>
          <ChevronsUpDown className="size-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Ver como admin</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {leagues.map((l) => {
          const active = l.id === currentLeagueId;
          return (
            <form key={l.id} action={setLeagueView}>
              <input type="hidden" name="leagueId" value={l.id} />
              <DropdownMenuItem
                asChild
                className={active ? "bg-[var(--color-surface-2)]" : ""}
              >
                <button type="submit" className="flex w-full items-center gap-2">
                  <span className="flex-1 truncate text-left">
                    {l.name}
                    {l.isPublic ? (
                      <span className="ml-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        pública
                      </span>
                    ) : null}
                  </span>
                  {active ? <Check className="size-3.5 text-[var(--color-arena)]" /> : null}
                </button>
              </DropdownMenuItem>
            </form>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
