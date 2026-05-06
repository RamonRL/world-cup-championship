"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDateTime, cn } from "@/lib/utils";
import { deleteLeague } from "@/lib/league-actions";
import { InviteLinkCopy } from "./invite-link-copy";

export type LeagueRow = {
  id: number;
  slug: string;
  name: string;
  inviteToken: string;
  joinCode: string | null;
  isPublic: boolean;
  /** ISO string */
  createdAt: string;
  creator: { nickname: string | null; email: string } | null;
  members: number;
};

type Mode = "cards" | "list";
const PAGE_SIZES = [10, 25, 50] as const;
type PageSize = (typeof PAGE_SIZES)[number];

export function LeaguesView({ leagues }: { leagues: LeagueRow[] }) {
  const [mode, setMode] = useState<Mode>("cards");
  const [pageSize, setPageSize] = useState<PageSize>(10);
  const [page, setPage] = useState(1);

  // La pública siempre va primero, fuera de la paginación. El resto se
  // pagina por createdAt asc (ya viene ordenado del server).
  const publicLeague = useMemo(() => leagues.find((l) => l.isPublic) ?? null, [leagues]);
  const privateLeagues = useMemo(() => leagues.filter((l) => !l.isPublic), [leagues]);

  const totalPages = Math.max(1, Math.ceil(privateLeagues.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * pageSize;
  const pagedPrivate = privateLeagues.slice(start, start + pageSize);
  const visible = publicLeague ? [publicLeague, ...pagedPrivate] : pagedPrivate;

  const onPageSize = (v: string) => {
    setPageSize(Number(v) as PageSize);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      {/* ─── Toolbar: toggle de vista + paginación ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
        <div className="inline-flex items-center gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] p-0.5">
          <ModeButton
            active={mode === "cards"}
            onClick={() => setMode("cards")}
            icon={<LayoutGrid className="size-3.5" />}
            label="Cuadros"
          />
          <ModeButton
            active={mode === "list"}
            onClick={() => setMode("list")}
            icon={<ListIcon className="size-3.5" />}
            label="Lista"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              Por página
            </span>
            <Select value={String(pageSize)} onValueChange={onPageSize}>
              <SelectTrigger className="h-8 w-[4.5rem]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((s) => (
                  <SelectItem key={s} value={String(s)}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="ghost"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Página anterior"
            >
              <ChevronLeft className="size-4" />
            </Button>
            <span className="font-mono tabular text-xs text-[var(--color-muted-foreground)]">
              {safePage} / {totalPages}
            </span>
            <Button
              size="icon"
              variant="ghost"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Página siguiente"
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>

          <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
            {privateLeagues.length} privadas · 1 pública
          </span>
        </div>
      </div>

      {/* ─── Vista activa ─── */}
      {mode === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {visible.map((l) => (
            <LeagueCard key={l.id} league={l} />
          ))}
        </div>
      ) : (
        <LeagueListTable leagues={visible} />
      )}
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 font-mono text-[0.6rem] uppercase tracking-[0.18em] transition",
        active
          ? "bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

// ──────────────────────── Vista cuadros ────────────────────────

function LeagueCard({ league }: { league: LeagueRow }) {
  return (
    <article
      className={cn(
        "rounded-xl border bg-[var(--color-surface)] p-5",
        league.isPublic
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))]"
          : "border-[var(--color-border)]",
      )}
    >
      <header className="flex items-start justify-between gap-3 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {league.isPublic ? (
              <Badge variant="success" className="text-[0.55rem]">
                Pública
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[0.55rem]">
                Privada
              </Badge>
            )}
            <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              {league.slug}
            </span>
            {league.joinCode ? (
              <span className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-arena)]">
                · {league.joinCode}
              </span>
            ) : null}
          </div>
          <h2 className="font-display text-2xl tracking-tight">{league.name}</h2>
        </div>
        {league.isPublic ? null : (
          <DeleteButton
            action={deleteLeague}
            id={league.id}
            confirmMessage={`¿Eliminar "${league.name}"? Sus ${league.members} miembros se moverán a la liga principal.`}
          />
        )}
      </header>

      <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
        <div className="flex items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Users className="size-3.5" />
            Miembros
          </span>
          <span className="font-display tabular text-base">{league.members}</span>
        </div>
        <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-muted-foreground)]">
          <span>
            Creada{" "}
            {formatDateTime(new Date(league.createdAt), { day: "2-digit", month: "short" })}
          </span>
          {league.creator ? (
            <span className="truncate">
              por {league.creator.nickname || league.creator.email.split("@")[0]}
            </span>
          ) : null}
        </div>
        {!league.isPublic ? <InviteLinkCopy token={league.inviteToken} /> : null}
        <Link
          href={`/admin/ligas/${league.id}`}
          className="mt-1 flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs font-medium transition hover:border-[var(--color-arena)]/40"
        >
          Gestionar miembros
          <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </article>
  );
}

// ──────────────────────── Vista lista ────────────────────────

function LeagueListTable({ leagues }: { leagues: LeagueRow[] }) {
  return (
    <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead className="w-24">Tipo</TableHead>
            <TableHead className="w-24">Código</TableHead>
            <TableHead>Creador</TableHead>
            <TableHead className="w-24 text-right">Miembros</TableHead>
            <TableHead className="w-16 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leagues.map((l) => (
            <TableRow
              key={l.id}
              className={cn(
                l.isPublic
                  ? "bg-[color-mix(in_oklch,var(--color-arena)_4%,transparent)]"
                  : undefined,
              )}
            >
              <TableCell>
                <Link
                  href={`/admin/ligas/${l.id}`}
                  className="group inline-flex items-center gap-1.5 font-medium underline-offset-4 hover:text-[var(--color-arena)] hover:underline"
                >
                  {l.name}
                  <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </Link>
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  {l.slug}
                </p>
              </TableCell>
              <TableCell>
                {l.isPublic ? (
                  <Badge variant="success" className="text-[0.55rem]">
                    Pública
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[0.55rem]">
                    Privada
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {l.joinCode ? (
                  <span className="font-mono tabular text-sm text-[var(--color-arena)]">
                    {l.joinCode}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--color-muted-foreground)]">—</span>
                )}
              </TableCell>
              <TableCell className="text-sm">
                {l.creator ? (
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {l.creator.nickname || l.creator.email.split("@")[0]}
                    </p>
                    <p className="truncate font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                      {l.creator.email}
                    </p>
                  </div>
                ) : (
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    Sistema
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right font-display tabular text-base">
                {l.members}
              </TableCell>
              <TableCell className="text-right">
                {l.isPublic ? null : (
                  <DeleteButton
                    action={deleteLeague}
                    id={l.id}
                    confirmMessage={`¿Eliminar "${l.name}"? Sus ${l.members} miembros se moverán a la liga principal.`}
                  />
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
