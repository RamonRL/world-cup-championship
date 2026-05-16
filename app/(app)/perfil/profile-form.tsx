"use client";

import { useActionState, useRef, useState } from "react";
import { Camera, Loader2, Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { initials } from "@/lib/utils";
import { compressImage, formatBytes } from "@/lib/client-image";
import { updateProfile, type FormState } from "./actions";

const initial: FormState = { ok: false };
/**
 * Tope absoluto del archivo crudo que el usuario elige (antes de comprimir).
 * Lo subimos a 20 MB para aceptar cualquier foto de móvil moderna; el
 * pipeline de compresión la deja en ~100-200 KB antes de salir.
 */
const MAX_RAW_INPUT_BYTES = 20 * 1024 * 1024;

type CompressInfo = {
  originalBytes: number;
  finalBytes: number;
  skipped: boolean;
};

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
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressInfo, setCompressInfo] = useState<CompressInfo | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const display = nickname || email.split("@")[0];

  async function pickFile(file: File) {
    setError(null);
    setCompressInfo(null);

    if (file.size > MAX_RAW_INPUT_BYTES) {
      setError(
        `La imagen pesa ${formatBytes(file.size)}. Demasiado grande, prueba con otra.`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setCompressing(true);
    try {
      const result = await compressImage(file, { maxDim: 800, quality: 0.85 });

      // Reemplazamos el File del <input type="file"> por la versión
      // comprimida usando DataTransfer — así la FormData del submit
      // envía el archivo optimizado sin tocar el server action.
      if (fileInputRef.current) {
        const dt = new DataTransfer();
        dt.items.add(result.file);
        fileInputRef.current.files = dt.files;
      }
      setPreview(URL.createObjectURL(result.file));
      setCompressInfo({
        originalBytes: result.originalBytes,
        finalBytes: result.finalBytes,
        skipped: result.skipped,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo procesar la imagen.");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } finally {
      setCompressing(false);
    }
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
                if (file) void pickFile(file);
              }}
              aria-label="Cambiar avatar"
              disabled={compressing}
              className="group relative mx-auto size-32 shrink-0 sm:mx-0"
            >
              <Avatar className="size-32 border-2 border-[var(--color-border-strong)] shadow-[var(--shadow-elev-1)] transition-all group-hover:border-[var(--color-arena)] group-hover:shadow-[var(--shadow-arena)]">
                {preview ? <AvatarImage src={preview} alt={display} /> : null}
                <AvatarFallback className="font-display text-4xl tracking-tight">
                  {initials(display)}
                </AvatarFallback>
              </Avatar>
              {/* Overlay: spinner durante compresión, cámara al hover */}
              <span
                aria-hidden
                className={`absolute inset-0 grid place-items-center rounded-full bg-black/55 transition-opacity ${
                  compressing ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                }`}
              >
                <span className="flex flex-col items-center gap-1 text-white">
                  {compressing ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Camera className="size-6" />
                  )}
                  <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em]">
                    {compressing ? "Optimizando" : "Cambiar"}
                  </span>
                </span>
              </span>
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
                  PNG/JPG/WEBP · Optimizamos la imagen automáticamente
                </span>
              </p>
              {compressInfo ? (
                <p className="font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-pitch)]">
                  {compressInfo.skipped
                    ? `Imagen lista (${formatBytes(compressInfo.finalBytes)})`
                    : `Optimizada: ${formatBytes(compressInfo.originalBytes)} → ${formatBytes(compressInfo.finalBytes)}`}
                </p>
              ) : null}
              {error ? (
                <p className="text-xs text-[var(--color-danger)]">{error}</p>
              ) : null}
            </div>

            <input
              ref={fileInputRef}
              id="avatar"
              name="avatar"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/heic,image/heif"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void pickFile(f);
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
        <Button type="submit" size="lg" disabled={pending || compressing}>
          <Save />
          {pending ? "Guardando…" : "Guardar"}
        </Button>
      </div>
    </form>
  );
}
