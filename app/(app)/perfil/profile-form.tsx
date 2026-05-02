"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import { updateProfile, type FormState } from "./actions";

const initial: FormState = { ok: false };
const MAX_AVATAR_BYTES = 1024 * 1024; // 1 MB

export function ProfileForm({
  email,
  nickname,
  avatarUrl,
}: {
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
}) {
  const [state, action, pending] = useActionState(updateProfile, initial);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [sizeError, setSizeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const display = nickname || email.split("@")[0];

  function pickFile(file: File) {
    if (file.size > MAX_AVATAR_BYTES) {
      setSizeError("La imagen pesa más de 1 MB. Súbela algo más ligera.");
      // Restablecer el input para que el form NO envíe el archivo grande.
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    setSizeError(null);
    setPreview(URL.createObjectURL(file));
  }

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* ─── Avatar como dropzone clickable ─── */}
          <div className="grid items-center gap-6 sm:grid-cols-[auto_1fr]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) pickFile(file);
              }}
              aria-label="Cambiar avatar"
              className="group relative mx-auto size-32 shrink-0 sm:mx-0"
            >
              <Avatar className="size-32 border-2 border-[var(--color-border-strong)] shadow-[var(--shadow-elev-1)] transition-all group-hover:border-[var(--color-arena)] group-hover:shadow-[var(--shadow-arena)]">
                {preview ? <AvatarImage src={preview} alt={display} /> : null}
                <AvatarFallback className="font-display text-4xl tracking-tight">
                  {initials(display)}
                </AvatarFallback>
              </Avatar>
              {/* Overlay al hover */}
              <span
                aria-hidden
                className="absolute inset-0 grid place-items-center rounded-full bg-black/55 opacity-0 transition-opacity group-hover:opacity-100"
              >
                <span className="flex flex-col items-center gap-1 text-white">
                  <Camera className="size-6" />
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em]">
                    Cambiar
                  </span>
                </span>
              </span>
              {/* Chip "Subir" siempre visible */}
              <span className="absolute -bottom-1 -right-1 flex size-9 items-center justify-center rounded-full bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)] ring-4 ring-[var(--color-surface)]">
                <Camera className="size-4" />
              </span>
            </button>

            <div className="space-y-1.5 text-center sm:text-left">
              <p className="font-display text-2xl tracking-tight sm:text-3xl">
                {display}
              </p>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                {email}
              </p>
              <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)]">
                Pulsa o arrastra una imagen sobre el avatar.
                <br />
                <span className="font-mono not-italic uppercase tracking-[0.18em]">
                  PNG/JPG · 1 MB máx
                </span>
              </p>
              {sizeError ? (
                <p className="text-xs text-[var(--color-danger)]">{sizeError}</p>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) pickFile(f);
              }}
            />
          </div>

          {/* ─── Apodo · underline minimal ─── */}
          <label className="group block space-y-2">
            <span className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition-colors group-focus-within:text-[var(--color-arena)]">
              Apodo
            </span>
            <input
              id="nickname"
              name="nickname"
              defaultValue={nickname ?? ""}
              maxLength={40}
              placeholder={email.split("@")[0]}
              className="w-full border-0 border-b-2 border-[var(--color-border)] bg-transparent px-0 pb-2 pt-1 font-display text-2xl tracking-tight text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted-foreground)]/50 focus:border-[var(--color-arena)] sm:text-3xl"
            />
            <span className="block font-editorial text-xs italic text-[var(--color-muted-foreground)]">
              Opcional. Si lo dejas vacío usamos la primera parte de tu email.
            </span>
          </label>
        </CardContent>
      </Card>

      {state.error ? (
        <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-[var(--color-success)]">Perfil actualizado.</p>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={pending}>
          <Save />
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
