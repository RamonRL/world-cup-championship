import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso",
};

const KICKOFF = process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reason?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user && !params.reason) redirect(params.next ?? "/dashboard");

  const kickoff = new Date(KICKOFF);
  const daysLeft = Math.max(
    0,
    Math.ceil((kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="relative grid min-h-dvh lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-[var(--color-surface)] lg:block">
        <div className="pitch-grid absolute inset-0 opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/30 via-transparent to-[var(--color-accent)]/20" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)] shadow-[var(--shadow-pitch)]">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                {process.env.NEXT_PUBLIC_APP_NAME ?? "World Cup Championship"}
              </p>
              <p className="font-display text-xl">Mundial 2026 · La quiniela</p>
            </div>
          </div>

          <div className="space-y-6">
            <Badge variant="success" className="gap-2 text-[0.7rem] uppercase tracking-wider">
              <span className="size-1.5 rounded-full bg-[var(--color-success)]" /> Faltan{" "}
              {daysLeft} días
            </Badge>
            <h1 className="font-display text-5xl leading-[0.95] sm:text-6xl">
              Predice cada gol.
              <br />
              <span className="text-[var(--color-primary)]">Discútelo con tus amigos.</span>
            </h1>
            <p className="max-w-sm text-sm text-[var(--color-muted-foreground)]">
              48 selecciones, 104 partidos y 6 categorías de predicción. Quien mejor lea el
              torneo, gana.
            </p>
            <ul className="grid gap-2 text-sm">
              <Bullet>Resultados exactos jornada a jornada</Bullet>
              <Bullet>Bracket eliminatorio interactivo</Bullet>
              <Bullet>Bota de Oro, Balón de Oro, Guante de Oro</Bullet>
              <Bullet>Goleador por partido y predicciones especiales</Bullet>
            </ul>
          </div>

          <p className="text-xs text-[var(--color-muted-foreground)]">
            Cualquiera con el enlace puede unirse. Tus predicciones permanecen privadas hasta el
            inicio de cada partido o ronda.
          </p>
        </div>
      </aside>

      <main className="flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-sm space-y-8">
          <div className="space-y-3 lg:hidden">
            <div className="grid size-11 place-items-center rounded-lg bg-[var(--color-primary)] text-[var(--color-primary-foreground)]">
              <Trophy className="size-5" />
            </div>
            <p className="font-display text-3xl">Mundial 2026</p>
          </div>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              Acceso
            </p>
            <h2 className="font-display text-4xl">Entrar a la quiniela</h2>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Magic link a tu email — sin contraseñas que olvidar.
            </p>
          </div>

          {params.reason === "banned" ? (
            <div className="rounded-lg border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
              Tu cuenta ha sido suspendida por el admin.
            </div>
          ) : null}

          <LoginForm next={params.next} />
        </div>
      </main>
    </div>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-[var(--color-muted-foreground)]">
      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[var(--color-accent)]" />
      <span>{children}</span>
    </li>
  );
}
