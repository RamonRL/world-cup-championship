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
      <div
        aria-hidden
        className="onboarding-orb pointer-events-none absolute -left-40 top-1/4 h-[420px] w-[420px] rounded-full opacity-50 blur-3xl"
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

      <div className="relative mx-auto flex min-h-dvh w-full max-w-5xl flex-col px-6 py-8 sm:px-10 sm:py-12 lg:px-12 lg:py-16">
        {/* Header — logo + branding + counter */}
        <header className="mb-12 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="block" aria-label="Quiniela Mundial">
            <Image
              src="/hlogo.png"
              alt="Quiniela Mundial"
              width={1919}
              height={660}
              priority
              className="h-9 w-auto sm:h-10"
            />
          </Link>
          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 sm:flex">
              <span className="relative flex size-2">
                <span
                  aria-hidden
                  className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-arena)] opacity-70"
                />
                <span className="relative inline-flex size-2 rounded-full bg-[var(--color-arena)]" />
              </span>
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                T-{days.toString().padStart(2, "0")} días al kickoff
              </p>
            </div>
            {!fresh ? (
              <Link
                href="/dashboard"
                className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
              >
                ← Dashboard
              </Link>
            ) : null}
          </div>
        </header>

        <div className="flex flex-1 flex-col justify-center">
          <OnboardingFlow step={step} fresh={fresh} userNickname={me.nickname} />
        </div>
      </div>
    </div>
  );
}
