import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata = { title: "Bienvenido" } satisfies Metadata;

type Step = "root" | "privada-elegir" | "privada-crear" | "privada-unirse";

const VALID_STEPS: Step[] = ["root", "privada-elegir", "privada-crear", "privada-unirse"];

const KICKOFF = process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z";

const MARQUEE_TOKENS = [
  "MUNDIAL FIFA 26",
  "CANADÁ",
  "MÉXICO",
  "USA",
  "11 JUN — 19 JUL",
  "48 SELECCIONES",
  "104 PARTIDOS",
];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const me = await requireUser();
  const fresh = me.leagueId == null;

  const params = await searchParams;
  const step: Step = (VALID_STEPS as string[]).includes(params.step ?? "")
    ? (params.step as Step)
    : "root";

  if (!fresh && step === "root") {
    redirect("/onboarding?step=privada-elegir");
  }

  const kickoff = new Date(KICKOFF);
  const days = Math.max(
    0,
    Math.ceil((kickoff.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
  );

  return (
    <div className="relative min-h-dvh overflow-hidden bg-[var(--color-bg)]">
      {/* ─── Fondo dinámico minimal ─── */}
      <div className="pitch-grid pointer-events-none absolute inset-0 opacity-30" aria-hidden />
      <div
        className="halftone pointer-events-none absolute inset-x-0 top-0 h-72 opacity-[0.05]"
        aria-hidden
      />
      {/* Orbe arena que pulsa lentamente al fondo, da movimiento sin marear */}
      <div
        aria-hidden
        className="onboarding-orb pointer-events-none absolute -left-40 top-1/3 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-arena) 22%, transparent), transparent 70%)",
        }}
      />
      <div
        aria-hidden
        className="onboarding-orb-2 pointer-events-none absolute -right-32 bottom-0 h-[360px] w-[360px] rounded-full opacity-40 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, color-mix(in oklch, var(--color-pitch) 28%, transparent), transparent 70%)",
        }}
      />

      <div className="relative grid min-h-dvh lg:grid-cols-[1.05fr_1.15fr]">
        {/* ─── COLUMNA IZQUIERDA · branding ─── */}
        <aside className="relative hidden flex-col justify-between border-r border-[var(--color-border)] bg-[color-mix(in_oklch,var(--color-surface)_70%,transparent)] p-12 backdrop-blur-sm lg:flex xl:p-16">
          <header className="flex items-center justify-between gap-4">
            <Link href="/dashboard" className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Copa Mundial de la FIFA 2026"
                width={48}
                height={48}
                priority
                className="size-12 rounded-md object-cover shadow-[var(--shadow-arena)]"
              />
              <span className="leading-tight">
                <span className="block font-display text-2xl tracking-tight">
                  Copa Mundial de la FIFA 2026
                </span>
                <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  La Quiniela
                </span>
              </span>
            </Link>
            <span className="hidden font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] xl:inline">
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
                T-{days.toString().padStart(2, "0")} días al kickoff
              </p>
            </div>

            <h1 className="font-display text-[5.5rem] leading-[0.85] tracking-tight xl:text-[7rem]">
              <span className="block">Crea</span>
              <span className="block">
                tu{" "}
                <span className="font-editorial italic font-light text-[var(--color-arena)]">
                  quiniela
                </span>
                .
              </span>
              <span className="block opacity-90">Reta</span>
              <span className="block opacity-70">a los tuyos.</span>
            </h1>

            <p className="max-w-md font-editorial text-lg italic leading-relaxed text-[var(--color-muted-foreground)]">
              Pública para competir contra todo el mundo, privada para tu grupo
              de siempre. Hasta 5 quinielas privadas por cuenta.
            </p>
          </div>

          {/* Marquee inferior */}
          <div className="-mx-12 overflow-hidden border-y border-[var(--color-border)] bg-[var(--color-surface)] py-2 xl:-mx-16">
            <div className="marquee flex w-max items-center gap-8 whitespace-nowrap font-display text-xs uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              {[...Array(2)].map((_, dup) => (
                <div key={dup} className="flex items-center gap-8 pr-8">
                  {MARQUEE_TOKENS.map((t, i) => (
                    <span key={`${dup}-${i}`} className="flex items-center gap-8">
                      <span>{t}</span>
                      <span className="size-1 rounded-full bg-[var(--color-arena)]" />
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* ─── COLUMNA DERECHA · acción ─── */}
        <main className="relative flex flex-col px-6 py-8 sm:px-10 sm:py-12 lg:px-16 lg:py-20 xl:px-24">
          {/* Header móvil — replica el branding del aside compacto */}
          <header className="mb-10 flex items-center justify-between gap-4 lg:hidden">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Image
                src="/logo.png"
                alt="Copa Mundial de la FIFA 2026"
                width={36}
                height={36}
                priority
                className="size-9 rounded-md object-cover shadow-[var(--shadow-arena)]"
              />
              <span className="leading-tight">
                <span className="block font-display text-lg tracking-tight">
                  Copa Mundial de la FIFA 2026
                </span>
                <span className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                  Quiniela
                </span>
              </span>
            </Link>
            {!fresh ? (
              <Link
                href="/dashboard"
                className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                Volver
              </Link>
            ) : null}
          </header>

          {/* Atajo "Volver al dashboard" en desktop sólo si no es onboarding inicial */}
          {!fresh ? (
            <div className="mb-8 hidden lg:flex">
              <Link
                href="/dashboard"
                className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
              >
                ← Volver al dashboard
              </Link>
            </div>
          ) : null}

          <div className="flex flex-1 flex-col justify-center">
            <div className="mx-auto w-full max-w-2xl">
              <OnboardingFlow step={step} fresh={fresh} userNickname={me.nickname} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
