import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  Flame,
  Lock,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type CategoryStatus =
  | "not-started"
  | "in-progress"
  | "complete"
  | "locked";

export type CategoryBadge = "start" | "continue" | "urgent" | null;

export function CategoryCard({
  icon: Icon,
  label,
  href,
  status,
  valueText,
  hintText,
  badge,
  fraction,
  cta,
}: {
  icon: LucideIcon;
  label: string;
  href: string;
  status: CategoryStatus;
  valueText: string;
  hintText?: string;
  badge?: CategoryBadge;
  fraction?: { done: number; total: number } | null;
  cta?: string;
}) {
  const accent: Record<CategoryStatus, string> = {
    "not-started":
      "border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-2)]/60",
    "in-progress":
      "border-[var(--color-arena)]/45 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))]",
    complete:
      "border-[var(--color-success)]/45 bg-[color-mix(in_oklch,var(--color-success)_5%,var(--color-surface))]",
    locked:
      "border-[var(--color-border)] bg-[var(--color-surface-2)]/40 opacity-70",
  };

  const stripe: Record<CategoryStatus, string> = {
    "not-started": "bg-[var(--color-muted-foreground)]/25",
    "in-progress": "bg-[var(--color-arena)]",
    complete: "bg-[var(--color-success)]",
    locked: "bg-[var(--color-muted-foreground)]/30",
  };

  const StatusGlyph =
    status === "complete"
      ? () => (
          <CheckCircle2 className="size-5 text-[var(--color-success)]" />
        )
      : status === "locked"
        ? () => (
            <Lock className="size-5 text-[var(--color-muted-foreground)]" />
          )
        : status === "in-progress"
          ? () => (
              <span className="relative inline-flex size-5 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-[var(--color-arena)]/60" />
                <span className="size-2.5 rounded-full bg-[var(--color-arena)] glow-arena" />
              </span>
            )
          : () => (
              <Circle className="size-5 text-[var(--color-muted-foreground)]/60" />
            );

  const showFraction =
    fraction != null && fraction.total > 1 && status !== "locked";

  const containerClass = `group relative flex h-full flex-col gap-3 overflow-hidden rounded-xl border p-4 transition ${
    accent[status]
  } ${
    status !== "locked"
      ? "hover:-translate-y-0.5 hover:border-[var(--color-arena)] hover:shadow-[var(--shadow-elev-2)]"
      : ""
  }`;

  const body = (
    <>
      {/* Left accent stripe */}
      <span
        aria-hidden
        className={`absolute inset-y-3 left-0 w-[3px] rounded-full ${stripe[status]}`}
      />

      {/* Header row: icon + status glyph + badge */}
      <div className="flex items-start justify-between gap-3 pl-2">
        <div className="flex items-center gap-2.5">
          <span
            className={`grid size-9 place-items-center rounded-md border ${
              status === "complete"
                ? "border-[var(--color-success)]/40 bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)] text-[var(--color-success)]"
                : status === "locked"
                  ? "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-muted-foreground)]"
                  : "border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] text-[var(--color-arena)]"
            }`}
          >
            <Icon className="size-4" />
          </span>
          <StatusGlyph />
        </div>
        {badge ? <Badge kind={badge} /> : null}
      </div>

      {/* Body: label + value */}
      <div className="space-y-1 pl-2">
        <p className="font-display text-xl leading-none tracking-tight">
          {label}
        </p>
        <p
          className={`font-mono text-[0.7rem] uppercase tracking-[0.22em] ${
            status === "complete"
              ? "text-[var(--color-success)]"
              : "text-[var(--color-muted-foreground)]"
          }`}
        >
          {valueText}
        </p>
      </div>

      {/* Fraction bar — only when meaningful */}
      {showFraction ? (
        <div className="space-y-1 pl-2">
          <div className="relative h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-3)]">
            <span
              className={`absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out ${
                status === "complete"
                  ? "bg-[var(--color-success)]"
                  : "bg-[var(--color-arena)]"
              }`}
              style={{
                width: `${Math.min(100, Math.round((fraction!.done / fraction!.total) * 100))}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Footer: hint + CTA */}
      <div className="mt-auto flex items-end justify-between gap-2 pl-2 pt-1">
        {hintText ? (
          <p className="font-editorial text-xs italic leading-tight text-[var(--color-muted-foreground)]">
            {hintText}
          </p>
        ) : (
          <span />
        )}
        {status !== "locked" && cta ? (
          <span className="flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-arena)] transition-transform group-hover:translate-x-0.5">
            {cta} <ArrowRight className="size-3" />
          </span>
        ) : null}
        {status === "locked" ? (
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            cerrado
          </span>
        ) : null}
      </div>
    </>
  );

  if (status === "locked") {
    return <div className={containerClass}>{body}</div>;
  }
  return (
    <Link href={href} className={containerClass}>
      {body}
    </Link>
  );
}

function Badge({ kind }: { kind: NonNullable<CategoryBadge> }) {
  if (kind === "urgent") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-arena)]/60 bg-[color-mix(in_oklch,var(--color-arena)_18%,transparent)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--color-arena)]">
        <Flame className="size-3" /> Cierra pronto
      </span>
    );
  }
  if (kind === "continue") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_10%,transparent)] px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--color-arena)]">
        <ArrowRight className="size-3" /> Continúa aquí
      </span>
    );
  }
  // start
  return (
    <span className="relative inline-flex items-center gap-1 overflow-hidden rounded-full border border-[var(--color-arena)]/60 px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-[0.22em] text-[var(--color-arena)]">
      <span aria-hidden className="absolute inset-0 -z-10 opacity-60 stripe" />
      <Sparkles className="size-3" /> Empieza aquí
    </span>
  );
}
