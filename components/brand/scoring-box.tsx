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
  className?: string;
};

/**
 * Visual breakdown of the scoring rules for a category. Shows each rule
 * as a `[N pts]` pill alongside its description so the player understands
 * exactly what they earn before predicting.
 *
 * Two density modes:
 *   - default ("full"): used on detail pages, larger spacing.
 *   - dense=true: used inside hub category cards, compact.
 */
export function ScoringBox({
  title = "Cómo se puntúa",
  sections,
  dense = false,
  footnote,
  className,
}: Props) {
  return (
    <section
      className={cn(
        "rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]",
        dense ? "p-3" : "p-5",
        className,
      )}
      aria-label={title}
    >
      <header className="flex items-center gap-2">
        <span
          aria-hidden
          className="h-px flex-1 bg-[var(--color-border)]"
        />
        <p
          className={cn(
            "font-mono uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]",
            dense ? "text-[0.55rem]" : "text-[0.6rem]",
          )}
        >
          {title}
        </p>
        <span
          aria-hidden
          className="h-px flex-1 bg-[var(--color-border)]"
        />
      </header>

      <div className={cn("space-y-3", dense ? "mt-3" : "mt-4")}>
        {sections.map((section, sIdx) => (
          <div
            key={section.heading ?? `s${sIdx}`}
            className={cn(sIdx > 0 && "border-t border-dashed border-[var(--color-border)] pt-3")}
          >
            {section.heading ? (
              <p
                className={cn(
                  "mb-2 font-mono uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]",
                  dense ? "text-[0.55rem]" : "text-[0.6rem]",
                )}
              >
                {section.heading}
              </p>
            ) : null}
            <ul className={cn("space-y-1.5", dense && "space-y-1")}>
              {section.rules.map((rule, rIdx) => (
                <li
                  key={`${sIdx}-${rIdx}`}
                  className="flex items-baseline gap-2.5"
                >
                  <PointPill points={rule.points} prefix={rule.prefix} bonus={rule.bonus} dense={dense} />
                  <span
                    className={cn(
                      "leading-snug text-[var(--color-foreground)]",
                      dense ? "text-xs" : "text-sm",
                    )}
                  >
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {footnote ? (
        <p
          className={cn(
            "mt-3 border-t border-dashed border-[var(--color-border)] pt-3 font-editorial italic text-[var(--color-muted-foreground)]",
            dense ? "text-[0.7rem]" : "text-xs",
          )}
        >
          {footnote}
        </p>
      ) : null}
    </section>
  );
}

function PointPill({
  points,
  prefix,
  bonus,
  dense,
}: {
  points: number;
  prefix?: "+" | "";
  bonus?: boolean;
  dense: boolean;
}) {
  const sign = prefix !== undefined ? prefix : bonus ? "+" : "";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-baseline justify-center rounded-md font-display tabular leading-none",
        dense
          ? "min-w-[2.25rem] gap-0 px-1.5 py-1 text-base"
          : "min-w-[3rem] gap-0.5 px-2 py-1.5 text-2xl",
        bonus
          ? "border border-dashed border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] text-[var(--color-arena)]"
          : "border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_12%,transparent)] text-[var(--color-arena)] glow-arena",
      )}
    >
      {sign ? (
        <span className={cn("opacity-70", dense ? "text-xs" : "text-base")}>{sign}</span>
      ) : null}
      <span>{points}</span>
      {dense ? null : (
        <span className="ml-0.5 self-end pb-0.5 text-[0.55rem] uppercase tracking-[0.18em] opacity-60">
          {points === 1 ? "pt" : "pts"}
        </span>
      )}
    </span>
  );
}
