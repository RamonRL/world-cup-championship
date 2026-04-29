"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "destructive" | "outline";
type Size = "icon" | "sm" | "default";

type Props = {
  action: (formData: FormData) => Promise<void>;
  id: number | string;
  confirmMessage: string;
  variant?: Variant;
  size?: Size;
  label?: string;
  className?: string;
};

/**
 * Generic delete button for admin tables: takes a server action reference and
 * an entity id, shows a confirm() dialog, and invokes the action via a
 * transition so the parent revalidatePath kicks in. Avoids the nested-<form>
 * problem that used to silently swallow click events.
 */
export function DeleteButton({
  action,
  id,
  confirmMessage,
  variant = "ghost",
  size = "icon",
  label,
  className,
}: Props) {
  const [pending, start] = useTransition();
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={pending}
      aria-label={label ?? "Eliminar"}
      className={cn(className)}
      onClick={() => {
        if (!confirm(confirmMessage)) return;
        start(async () => {
          const fd = new FormData();
          fd.set("id", id.toString());
          await action(fd);
        });
      }}
    >
      <Trash2 className="size-4" />
      {label && size !== "icon" ? (
        <span>{pending ? "Eliminando…" : label}</span>
      ) : null}
    </Button>
  );
}
