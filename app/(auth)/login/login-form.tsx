"use client";

import { useActionState } from "react";
import { ArrowRight, Inbox, Mail } from "lucide-react";
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
      <div className="relative overflow-hidden rounded-2xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_6%,var(--color-surface))] p-6 sm:p-8">
        <div
          aria-hidden
          className="halftone pointer-events-none absolute inset-0 opacity-[0.06]"
        />
        <div className="relative space-y-5 text-center">
          <div className="mx-auto grid size-16 place-items-center rounded-full border border-[var(--color-arena)]/40 bg-[var(--color-surface)] text-[var(--color-arena)] shadow-[var(--shadow-arena)]">
            <Inbox className="size-7" />
          </div>
          <div className="space-y-2">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
              Enlace enviado
            </p>
            <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
              Revisa tu bandeja
            </h2>
          </div>
          <div className="mx-auto inline-flex max-w-full items-center gap-2 truncate rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
            <Mail className="size-3.5 shrink-0 text-[var(--color-muted-foreground)]" />
            <span className="truncate font-medium">{state.email}</span>
          </div>
          <p className="font-editorial text-sm italic leading-relaxed text-[var(--color-muted-foreground)]">
            Pulsa el enlace que te acabamos de enviar y entrarás directo. Si no
            lo ves en unos segundos, revisa la carpeta de spam.
          </p>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
            Puedes cerrar esta pestaña
          </p>
        </div>
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
