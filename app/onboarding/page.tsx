import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { OnboardingFlow } from "./onboarding-flow";

export const metadata: Metadata = { title: "Bienvenido" };

type Step = "root" | "privada-elegir" | "privada-crear" | "privada-unirse";

const VALID_STEPS: Step[] = ["root", "privada-elegir", "privada-crear", "privada-unirse"];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>;
}) {
  const me = await requireUser();
  // Si ya tiene liga activa, no debería estar en onboarding salvo que
  // esté usando el botón "+" del switcher para añadir más. En ese caso
  // permitimos pero saltamos el step "Pública" porque ya la tiene.
  const fresh = me.leagueId == null;

  const params = await searchParams;
  const step: Step = (VALID_STEPS as string[]).includes(params.step ?? "")
    ? (params.step as Step)
    : "root";

  if (!fresh && step === "root") {
    // Usuario que ya está en la app y pulsó "+". Saltamos a "privada-elegir"
    // (a no ser que el caller pidiera otro step explícitamente).
    redirect("/onboarding?step=privada-elegir");
  }

  return (
    <div className="relative min-h-dvh bg-[var(--color-bg)]">
      <div
        className="halftone pointer-events-none absolute inset-x-0 top-0 h-40 opacity-[0.05]"
        aria-hidden
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-3xl flex-col px-6 py-10 lg:py-16">
        <header className="mb-10 flex items-center justify-between gap-4">
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
              Volver al dashboard →
            </Link>
          ) : null}
        </header>

        <OnboardingFlow step={step} fresh={fresh} userNickname={me.nickname} />
      </div>
    </div>
  );
}
