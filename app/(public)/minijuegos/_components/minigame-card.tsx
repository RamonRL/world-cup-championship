import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MinigameDef } from "../_lib/games";

type Props = {
  game: MinigameDef;
  /** Mejor puntuación del visitante (si la tiene en ese juego). */
  myBestScore?: number | null;
  /** Total de participantes con score en ese juego. */
  totalParticipants?: number;
};

export function MinigameCard({ game, myBestScore, totalParticipants }: Props) {
  const Icon = game.icon;
  const soon = game.status === "soon";

  const Inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="grid size-12 place-items-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          <Icon className="size-6 text-[var(--color-arena)]" />
        </div>
        {soon ? (
          <span className="flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">
            <Clock className="size-3" />
            Próximamente
          </span>
        ) : (
          <span className="rounded-full border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] px-2.5 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.24em] text-[var(--color-arena)]">
            Disponible
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {game.tagline}
        </p>
        <h3 className="font-display text-2xl tracking-tight">{game.name}</h3>
        <p className="font-editorial text-sm italic leading-snug text-[var(--color-muted-foreground)]">
          {game.description}
        </p>
      </div>
      <div className="mt-auto flex items-end justify-between gap-3 pt-2">
        <div className="space-y-0.5 font-mono text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">
          {myBestScore != null ? (
            <p>
              Mejor:{" "}
              <span className="font-display text-lg tabular text-[var(--color-foreground)]">
                {myBestScore}
              </span>
            </p>
          ) : null}
          {totalParticipants != null && totalParticipants > 0 ? (
            <p>
              {totalParticipants} {totalParticipants === 1 ? "jugador" : "jugadores"}
            </p>
          ) : null}
        </div>
        {!soon ? (
          <span className="inline-flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.24em] text-[var(--color-arena)]">
            Jugar
            <ArrowRight className="size-3.5" />
          </span>
        ) : null}
      </div>
    </>
  );

  const className = cn(
    "flex h-full flex-col gap-3 rounded-xl border bg-[var(--color-surface)] p-5 transition-all",
    soon
      ? "border-dashed border-[var(--color-border)] opacity-70"
      : "border-[var(--color-border)] hover:-translate-y-0.5 hover:border-[var(--color-arena)]/50 hover:shadow-[var(--shadow-elev-2)]",
  );

  if (soon) {
    return (
      <div aria-disabled className={className}>
        {Inner}
      </div>
    );
  }
  return (
    <Link href={`/minijuegos/${game.slug}`} className={cn(className, "group")}>
      {Inner}
    </Link>
  );
}
