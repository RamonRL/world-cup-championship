"use client";

import { useActionState, useState } from "react";
import { Save } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { initials } from "@/lib/utils";
import { updateProfile, type FormState } from "./actions";

const initial: FormState = { ok: false };

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
  const display = nickname || email.split("@")[0];

  return (
    <form action={action} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Identidad</CardTitle>
          <CardDescription>
            Tu email queda fijo (es tu identidad de acceso): {email}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Avatar className="size-24 border border-[var(--color-border-strong)] shadow-[var(--shadow-elev-1)]">
              {preview ? <AvatarImage src={preview} alt={display} /> : null}
              <AvatarFallback className="font-display text-3xl">
                {initials(display)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Label
                htmlFor="avatar"
                className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]"
              >
                Avatar
              </Label>
              <Input
                id="avatar"
                name="avatar"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) setPreview(URL.createObjectURL(f));
                }}
              />
              <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)]">
                PNG/JPG cuadrado. Se recorta a círculo en ranking, podio y chat.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="nickname"
              className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]"
            >
              Apodo
            </Label>
            <Input
              id="nickname"
              name="nickname"
              defaultValue={nickname ?? ""}
              maxLength={40}
              placeholder={email.split("@")[0]}
            />
            <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)]">
              Si lo dejas vacío, se mostrará la primera parte de tu email.
            </p>
          </div>
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
          {pending ? "Guardando…" : "Guardar perfil"}
        </Button>
      </div>
    </form>
  );
}
