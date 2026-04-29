import { cn } from "@/lib/utils";

type Props = {
  title: string;
  eyebrow?: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, eyebrow, description, actions, className }: Props) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 border-b border-[var(--color-border)] pb-6 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--color-muted-foreground)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{title}</h1>
        {description ? (
          <p className="max-w-2xl text-sm text-[var(--color-muted-foreground)]">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  );
}
