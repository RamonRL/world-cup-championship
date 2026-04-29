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
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center",
        className,
      )}
    >
      {icon ? (
        <div className="grid size-12 place-items-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          {icon}
        </div>
      ) : null}
      <h3 className="font-display text-2xl">{title}</h3>
      {description ? (
        <p className="max-w-md text-sm text-[var(--color-muted-foreground)]">{description}</p>
      ) : null}
      {action ? <div className="pt-2">{action}</div> : null}
    </div>
  );
}
