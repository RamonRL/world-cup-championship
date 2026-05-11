"use client";

import { useEffect, useState } from "react";

type Tone = "active" | "complete" | "locked";

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export function ProgressDonut({
  value,
  total,
  size = 180,
  tone,
  centerTop,
  centerBottom,
}: {
  value: number;
  total: number;
  size?: number;
  tone?: Tone;
  centerTop: string;
  centerBottom: string;
}) {
  const ratio = total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const resolvedTone: Tone = tone ?? (value >= total && total > 0 ? "complete" : "active");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (reduced) {
        setMounted(true);
        return;
      }
      const id = window.requestAnimationFrame(() => setMounted(true));
      return () => window.cancelAnimationFrame(id);
    }
  }, []);

  const offset = mounted
    ? CIRCUMFERENCE * (1 - ratio)
    : CIRCUMFERENCE;

  const strokeColor =
    resolvedTone === "complete"
      ? "var(--color-success)"
      : resolvedTone === "locked"
        ? "var(--color-muted-foreground)"
        : "var(--color-arena)";
  const glowColor =
    resolvedTone === "complete"
      ? "color-mix(in oklch, var(--color-success) 55%, transparent)"
      : resolvedTone === "locked"
        ? "transparent"
        : "color-mix(in oklch, var(--color-arena) 55%, transparent)";
  const filter =
    resolvedTone === "locked"
      ? undefined
      : `drop-shadow(0 0 6px ${glowColor}) drop-shadow(0 0 12px ${glowColor})`;

  const centerTopClass =
    resolvedTone === "complete"
      ? "text-[var(--color-success)] glow-pitch"
      : resolvedTone === "locked"
        ? "text-[var(--color-muted-foreground)]"
        : "text-[var(--color-arena)] glow-arena";

  return (
    <div
      className="relative isolate inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
    >
      {/* halftone halo behind the ring */}
      <span
        aria-hidden
        className="absolute inset-0 -z-10 rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklch,var(--color-arena)_18%,transparent),transparent_62%)]"
      />
      <svg
        viewBox="0 0 120 120"
        width={size}
        height={size}
        role="img"
        aria-label={`${value} de ${total} completado`}
      >
        {/* Track */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--color-surface-3)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity={0.55}
        />
        {/* Tick marks at each category step, subtle */}
        {total > 0 && total <= 6
          ? Array.from({ length: total }).map((_, i) => {
              const angle = (i / total) * 2 * Math.PI - Math.PI / 2;
              const x1 = 60 + (RADIUS - 9) * Math.cos(angle);
              const y1 = 60 + (RADIUS - 9) * Math.sin(angle);
              const x2 = 60 + (RADIUS + 9) * Math.cos(angle);
              const y2 = 60 + (RADIUS + 9) * Math.sin(angle);
              const filled = i < Math.round(ratio * total);
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke={filled ? strokeColor : "var(--color-border)"}
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  opacity={filled ? 0.7 : 0.45}
                />
              );
            })
          : null}
        {/* Progress arc */}
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={strokeColor}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform="rotate(-90 60 60)"
          style={{
            transition: "stroke-dashoffset 900ms cubic-bezier(.22,1,.36,1)",
            filter,
          }}
        />
      </svg>
      {/* Center label */}
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-0.5 text-center">
        <span
          className={`font-display tabular text-4xl leading-none tracking-tight sm:text-5xl ${centerTopClass}`}
        >
          {centerTop}
        </span>
        <span className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {centerBottom}
        </span>
      </div>
    </div>
  );
}
