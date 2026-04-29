"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";

export function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme();
  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast bg-[var(--color-surface)] text-[var(--color-foreground)] border-[var(--color-border)] shadow-lg",
          description: "text-[var(--color-muted-foreground)]",
          actionButton:
            "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]",
          cancelButton:
            "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]",
        },
      }}
      {...props}
    />
  );
}
