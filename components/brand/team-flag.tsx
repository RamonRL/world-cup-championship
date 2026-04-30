import { cn } from "@/lib/utils";
import { circleFlagUrl } from "@/lib/flags";

type Props = {
  /** FIFA 3-letter code, e.g. "MEX", "USA", "ENG". */
  code: string | null | undefined;
  /** Pixel size of the rendered chip. Default 24. */
  size?: number;
  /** Optional extra classes for the wrapper (border, ring, shadow…). */
  className?: string;
  /**
   * If true, renders the chip without any background fill — useful when the
   * surrounding context already provides a contrasting backdrop and we want
   * the flag to blend.
   */
  bare?: boolean;
};

/**
 * Circular flag chip. Renders the HatScripts circle-flag SVG full-bleed
 * inside a `rounded-full` container so it always fills the box perfectly
 * regardless of the source flag's aspect ratio. Falls back to the team's
 * FIFA code as text if the code is unknown.
 */
export function TeamFlag({ code, size = 24, className, bare = false }: Props) {
  const url = circleFlagUrl(code);
  return (
    <span
      className={cn(
        "relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full",
        bare ? "" : "bg-[var(--color-surface-2)] ring-1 ring-[var(--color-border)]",
        className,
      )}
      style={{ width: size, height: size }}
      aria-hidden={!code}
    >
      {url ? (
        // Plain <img> on purpose: tiny static SVGs from a CDN don't benefit
        // from next/image optimisation, and avoiding it sidesteps having to
        // enable `dangerouslyAllowSVG` globally.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={code ?? ""}
          width={size}
          height={size}
          className="size-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-mono text-[0.55rem] uppercase tracking-tight text-[var(--color-muted-foreground)]">
          {code?.slice(0, 2) ?? "?"}
        </span>
      )}
    </span>
  );
}
