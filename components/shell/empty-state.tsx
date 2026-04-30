import { cn } from "@/lib/utils";

type Props = {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: Props) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center gap-3 overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center",
        className,
      )}
    >
      <div className="halftone pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden />
      {icon ? (
        <div className="grid size-14 place-items-center rounded-full border border-[var(--color-arena)]/30 bg-[var(--color-arena)]/10 text-[var(--color-arena)]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-3xl tracking-tight">{title}</h3>
      {description ? (
        <p className="max-w-md font-editorial text-base italic leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
