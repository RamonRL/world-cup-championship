import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.65rem] font-semibold uppercase tracking-[0.14em] transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--color-arena)] text-white",
        secondary:
          "border-transparent bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        outline:
          "border-[var(--color-border-strong)] bg-transparent text-[var(--color-foreground)]",
        success:
          "border-transparent bg-[color-mix(in_oklch,var(--color-success)_22%,transparent)] text-[var(--color-success)]",
        warning:
          "border-transparent bg-[color-mix(in_oklch,var(--color-warning)_28%,transparent)] text-[var(--color-warning)]",
        danger:
          "border-transparent bg-[color-mix(in_oklch,var(--color-danger)_22%,transparent)] text-[var(--color-danger)]",
        accent:
          "border-transparent bg-[var(--color-accent)] text-[var(--color-accent-foreground)]",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
