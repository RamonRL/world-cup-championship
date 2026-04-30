import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type ScoringRule = {
  points: number;
  /**
   * Prefix shown next to the number. Defaults to "+" when `bonus` is true,
   * empty string otherwise.
   */
  prefix?: "+" | "";
  /** Short description that explains when the user earns this. */
  label: string;
  /** Render the pill in arena (muted) styling — for bonuses and stacked extras. */
  bonus?: boolean;
};

export type ScoringSection = {
  heading?: string;
  rules: ScoringRule[];
};

type Props = {
  /** Optional title rendered in the eyebrow. Defaults to "Cómo se puntúa". */
  title?: string;
  sections: ScoringSection[];
  /** Compact rendering for hub cards — smaller pills, tighter spacing. */
  dense?: boolean;
  /** Footer note (e.g. "Máximo 12 pts por grupo"). */
  footnote?: string;
  /** Whether the box renders open by default. Defaults to false (closed). */
  defaultOpen?: boolean;
  className?: string;
};

/**
 * Collapsible breakdown of the scoring rules for a category. Closed by
 * default — clicking the header expands a scrollable body that lists each
 * rule as `[N pts] · description`. Uses native `<details>`/`<summary>` so
 * keyboard nav and screen readers work without extra JS.
 */
export function ScoringBox({
  title = "Cómo se puntúa",
  sections,
  dense = false,
  footnote,
  defaultOpen = false,
  className,
}: Props) {
  const totalRules = sections.reduce((sum, s) => sum + s.rules.length, 0);

  return (
    <details
      className={cn(
        "group rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]",
        className,
      )}
      open={defaultOpen}
    >
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-surface)]",
          "marker:hidden [&::-webkit-details-marker]:hidden",
        )}
      >
        <ChevronRight
          aria-hidden
          className="size-3.5 shrink-0 text-[var(--color-muted-foreground)] transition-transform duration-150 group-open:rotate-90"
        />
        <span
          className={cn(
            "flex-1 font-mono uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]",
            dense ? "text-[0.55rem]" : "text-[0.6rem]",
          )}
        >
          {title}
        </span>
        <span className="shrink-0 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
          {totalRules} {totalRules === 1 ? "regla" : "reglas"}
        </span>
      </summary>

      <div className="border-t border-[var(--color-border)]">
        <div
          className={cn(
            "max-h-60 overflow-y-auto",
            dense ? "px-3 py-2.5" : "px-3 py-3",
          )}
        >
          <div className="space-y-2.5">
            {sections.map((section, sIdx) => (
              <div
                key={section.heading ?? `s${sIdx}`}
                className={cn(sIdx > 0 && "border-t border-dashed border-[var(--color-border)] pt-2.5")}
              >
                {section.heading ? (
                  <p className="mb-1.5 font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                    {section.heading}
                  </p>
                ) : null}
                <ul className="space-y-1">
                  {section.rules.map((rule, rIdx) => (
                    <li
                      key={`${sIdx}-${rIdx}`}
                      className="flex items-center gap-2"
                    >
                      <PointPill points={rule.points} prefix={rule.prefix} bonus={rule.bonus} />
                      <span className="text-xs leading-snug text-[var(--color-foreground)]">
                        {rule.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {footnote ? (
          <p className="border-t border-dashed border-[var(--color-border)] px-3 py-2 font-editorial text-[0.7rem] italic text-[var(--color-muted-foreground)]">
            {footnote}
          </p>
        ) : null}
      </div>
    </details>
  );
}

function PointPill({
  points,
  prefix,
  bonus,
}: {
  points: number;
  prefix?: "+" | "";
  bonus?: boolean;
}) {
  const sign = prefix !== undefined ? prefix : bonus ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-baseline justify-center gap-0 rounded font-display tabular leading-none",
        "min-w-[2rem] px-1.5 py-1 text-sm",
        bonus
          ? "border border-dashed border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] text-[var(--color-arena)]"
          : "border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_12%,transparent)] text-[var(--color-arena)] glow-arena",
      )}
    >
      {sign ? <span className="text-[0.65rem] opacity-70">{sign}</span> : null}
      <span>{points}</span>
    </span>
  );
}
