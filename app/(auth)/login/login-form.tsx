"use client";

import { Button } from "@/components/ui/button";
import { GoogleIcon } from "@/components/icons/google";
import { signInWithGoogle } from "./actions";

export function LoginForm({ next }: { next?: string }) {
  return (
    <div className="space-y-4">
      <form action={signInWithGoogle}>
        {next ? <input type="hidden" name="next" value={next} /> : null}
        <Button type="submit" variant="outline" size="lg" className="w-full">
          <GoogleIcon className="size-5" />
          Continuar con Google
        </Button>
      </form>
      <p className="text-center text-xs text-[var(--color-muted-foreground)]">
        Iniciamos sesión con tu cuenta de Google. Sin contraseñas.
      </p>
    </div>
  );
}
