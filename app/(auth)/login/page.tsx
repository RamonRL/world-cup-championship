import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Image from "next/image";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Acceso",
};

const KICKOFF = process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z";

const HOSTS = ["CANADÁ", "MÉXICO", "USA"];

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
    <div className="relative grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <aside className="spotlight relative hidden overflow-hidden border-r border-[var(--color-border)] bg-[var(--color-surface)] lg:block">
        <div className="pitch-grid absolute inset-0 opacity-50" aria-hidden />
        <span
          aria-hidden
          className="halftone pointer-events-none absolute inset-x-0 top-0 h-40 opacity-[0.08]"
        />

        <div className="relative flex h-full flex-col justify-between p-14">
          <header className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Copa Mundial de la FIFA 2026"
                width={44}
                height={44}
                priority
                className="size-11 rounded-md object-cover shadow-[var(--shadow-arena)]"
              />
              <div className="leading-tight">
                <p className="text-[0.7rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  {process.env.NEXT_PUBLIC_APP_NAME ?? "World Cup Championship"}
                </p>
                <p className="font-display text-xl tracking-tight">
                  La quiniela de la Copa Mundial de la FIFA 2026
                </p>
              </div>
            </div>
            <span className="hidden font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] xl:inline">
              MMXXVI
            </span>
          </header>

          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <span className="relative flex size-2">
                <span
                  aria-hidden
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-arena)] opacity-70"
                />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--color-arena)]" />
              </span>
              <p className="font-mono text-xs uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                T-{daysLeft.toString().padStart(2, "0")} días al kickoff
              </p>
            </div>

            <h1 className="font-display text-[6.5rem] leading-[0.85] tracking-tight">
              <span className="block">Predice</span>
              <span className="block">
                cada{" "}
                <span className="font-editorial italic font-light text-[var(--color-arena)]">
                  gol
                </span>
                .
              </span>
              <span className="block opacity-90">Discútelo</span>
              <span className="block opacity-70">con los tuyos.</span>
            </h1>

            <p className="max-w-md font-editorial text-lg italic leading-relaxed text-[var(--color-muted-foreground)]">
              Quien mejor lea el torneo, gana.
            </p>
          </div>

          <footer className="space-y-6">
            <div className="flex items-center gap-3 overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3">
              {HOSTS.map((host, i) => (
                <span key={host} className="flex items-center gap-3">
                  {i > 0 ? (
                    <span className="size-1 rounded-full bg-[var(--color-border-strong)]" />
                  ) : null}
                  <span className="font-display text-sm tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    {host}
                  </span>
                </span>
              ))}
              <span className="ml-auto font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Anfitriones
              </span>
            </div>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Tus picks, sólo tuyas hasta el kickoff.
            </p>
          </footer>
        </div>
      </aside>

      <main className="relative flex items-center justify-center overflow-hidden px-6 py-12 sm:px-10">
        <div className="halftone pointer-events-none absolute right-0 top-0 h-40 w-40 opacity-[0.05]" aria-hidden />
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center space-y-4 text-center lg:hidden">
            <Image
              src="/logo.png"
              alt="Copa Mundial de la FIFA 2026"
              width={72}
              height={72}
              priority
              className="size-[72px] rounded-md object-cover shadow-[var(--shadow-arena)]"
            />
            <p className="font-display text-3xl leading-tight tracking-tight sm:text-4xl">
              Copa Mundial de la FIFA 2026
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_8%,transparent)] px-3 py-1 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
              <span className="relative flex size-1.5">
                <span
                  aria-hidden
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-arena)] opacity-70"
                />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--color-arena)]" />
              </span>
              T-{daysLeft.toString().padStart(2, "0")} días al kickoff
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-[var(--color-arena)]" />
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Acceso
              </p>
            </div>
            <h2 className="font-display text-5xl tracking-tight">Entra a la quiniela</h2>
            <p className="font-editorial text-base italic text-[var(--color-muted-foreground)]">
              Con tu cuenta de Google.
            </p>
          </div>

          {params.reason === "banned" ? (
            <div className="rounded-md border border-[var(--color-danger)]/40 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
              Tu cuenta ha sido suspendida por el admin.
            </div>
          ) : null}

          <LoginForm next={params.next} />

          {/* Mini-tagline para el móvil — refuerza el "qué es esto" para
              quien aterriza sin contexto. En desktop ya lo cubre el aside. */}
          <p className="text-center font-editorial text-xs italic text-[var(--color-muted-foreground)] lg:hidden">
            Quien mejor lea el torneo, gana.
          </p>
        </div>
      </main>
    </div>
  );
}
