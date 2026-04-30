import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-arena)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-[var(--color-arena)] text-white shadow-[0_2px_0_color-mix(in_oklch,var(--color-arena)_70%,black)] hover:translate-y-[-1px] hover:shadow-[0_4px_0_color-mix(in_oklch,var(--color-arena)_70%,black)] active:translate-y-0 active:shadow-[0_1px_0_color-mix(in_oklch,var(--color-arena)_70%,black)]",
        secondary:
          "bg-[var(--color-surface-2)] text-[var(--color-foreground)] hover:bg-[var(--color-surface-3)]",
        outline:
          "border border-[var(--color-border-strong)] bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-arena)]/50",
        ghost:
          "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-surface-2)]",
        destructive:
          "bg-[var(--color-danger)] text-white hover:opacity-90",
        accent:
          "bg-[var(--color-accent)] text-[var(--color-accent-foreground)] hover:translate-y-[-1px] shadow-[0_2px_0_color-mix(in_oklch,var(--color-accent)_70%,black)]",
        link: "text-[var(--color-arena)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-md px-6 text-sm uppercase tracking-[0.12em]",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
