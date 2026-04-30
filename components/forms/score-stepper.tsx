"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: number;
  onChange: (next: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  /** Accessible label for the score, e.g. "Goles España". */
  ariaLabel?: string;
  className?: string;
};

/**
 * Touch-friendly score stepper: `[-]  N  [+]`. Replaces the bare number input
 * in score predictions so the user can tap to bump the goals up or down
 * instead of typing a number.
 */
export function ScoreStepper({
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 20,
  ariaLabel,
  className,
}: Props) {
  const dec = () => {
    if (disabled) return;
    if (value > min) onChange(value - 1);
  };
  const inc = () => {
    if (disabled) return;
    if (value < max) onChange(value + 1);
  };
  const atMin = value <= min;
  const atMax = value >= max;
  return (
    <div
      className={cn(
        "inline-flex items-center gap-0 overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]",
        disabled && "opacity-60",
        className,
      )}
      role="group"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        onClick={dec}
        disabled={disabled || atMin}
        aria-label="Restar gol"
        className={cn(
          "grid size-11 place-items-center text-[var(--color-muted-foreground)] transition",
          "active:bg-[var(--color-surface-2)]",
          atMin || disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-arena)]",
        )}
      >
        <Minus className="size-4" />
      </button>
      <span
        aria-live="polite"
        className="grid h-11 w-12 place-items-center border-x border-[var(--color-border)] bg-[var(--color-surface-2)] font-display tabular text-2xl tracking-tight text-[var(--color-foreground)]"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={inc}
        disabled={disabled || atMax}
        aria-label="Sumar gol"
        className={cn(
          "grid size-11 place-items-center text-[var(--color-muted-foreground)] transition",
          "active:bg-[var(--color-surface-2)]",
          atMax || disabled
            ? "cursor-not-allowed opacity-40"
            : "hover:bg-[var(--color-surface-2)] hover:text-[var(--color-arena)]",
        )}
      >
        <Plus className="size-4" />
      </button>
    </div>
  );
}
