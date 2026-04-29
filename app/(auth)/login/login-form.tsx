"use client";

import { useActionState } from "react";
import { ArrowRight, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GoogleIcon } from "@/components/icons/google";
import { requestMagicLink, signInWithGoogle, type LoginState } from "./actions";

const initial: LoginState = { status: "idle" };

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(requestMagicLink, initial);

  if (state.status === "sent") {
    return (
      <div className="space-y-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-primary)]/15 text-[var(--color-primary)]">
          <Mail className="size-6" />
        </div>
        <h2 className="font-display text-3xl">Revisa tu bandeja</h2>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Te hemos enviado un enlace mágico a{" "}
          <span className="font-medium text-[var(--color-foreground)]">{state.email}</span>. Pulsa
          el enlace y entrarás directo. Puedes cerrar esta pestaña.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <form action={signInWithGoogle}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <GoogleIcon className="size-5" />
          Continuar con Google
        </Button>
      </form>

      <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
        <span className="h-px flex-1 bg-[var(--color-border)]" />
        <span>o por email</span>
        <span className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <form action={action} className="space-y-5">
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-xs uppercase tracking-wider">
            Email
          </Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="tu@email.com"
            required
          />
        </div>
        {state.status === "error" ? (
          <p className="text-sm text-[var(--color-danger)]">{state.message}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Enviando enlace…" : "Recibir enlace mágico"}
          <ArrowRight />
        </Button>
        <p className="text-xs text-[var(--color-muted-foreground)]">
          Sin contraseñas. Te enviamos un enlace único a tu email; al pulsarlo entras.
        </p>
      </form>
    </div>
  );
}
