"use client";

import Link from "next/link";
import { useActionState, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  Globe,
  Lock,
  Plus,
  Sparkles,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  createLeague,
  joinLeagueByCode,
  type CreateLeagueResult,
  type LeagueFormState,
} from "@/lib/league-actions";
import { chooseActivePublic } from "./actions";

type Step = "root" | "privada-elegir" | "privada-crear" | "privada-unirse";

const initialCreate: CreateLeagueResult = { ok: false };
const initialJoin: LeagueFormState = { ok: false };

export function OnboardingFlow({
  step,
  fresh,
  userNickname,
}: {
  step: Step;
  fresh: boolean;
  userNickname: string | null;
}) {
  const router = useRouter();

  if (step === "root") {
    return (
      <div className="space-y-10">
        <Eyebrow>Onboarding</Eyebrow>
        <header className="space-y-4">
          <h1 className="font-display text-5xl tracking-tight sm:text-6xl xl:text-7xl">
            {userNickname ? `Hola, ${userNickname}` : "Bienvenido a la quiniela"}
          </h1>
          <p className="font-editorial text-lg italic leading-relaxed text-[var(--color-muted-foreground)] sm:text-xl">
            ¿Dónde quieres jugar? Puedes estar en la pública y en tantas
            privadas como quieras (hasta 5).
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceCard
            icon={<Globe className="size-6" />}
            label="Quiniela Pública"
            description="La gran liga abierta donde compite todo el mundo."
            footer="Recomendada si quieres comparar tu pulso con la comunidad entera."
            primary
            onClick={async () => {
              await chooseActivePublic();
            }}
            actionLabel="Entrar"
          />
          <ChoiceCard
            icon={<Lock className="size-6" />}
            label="Quiniela Privada"
            description="Crea una para tu grupo o únete con un código de 4 dígitos."
            footer="Pensado para amigos, oficinas, peñas. Hasta 5 privadas por usuario."
            onClick={() => {
              router.push("/onboarding?step=privada-elegir");
            }}
            actionLabel="Continuar"
          />
        </div>
      </div>
    );
  }

  if (step === "privada-elegir") {
    return (
      <div className="space-y-10">
        <BackButton href={fresh ? "/onboarding" : "/dashboard"} />
        <Eyebrow>Quiniela privada</Eyebrow>
        <header className="space-y-4">
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl xl:text-6xl">
            ¿Crear una nueva o unirte a una existente?
          </h1>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <ChoiceCard
            icon={<Plus className="size-6" />}
            label="Crear una quiniela"
            description="Pones nombre, recibes un código de 4 dígitos y un enlace para compartir."
            footer="Tú serás el primer miembro y la liga aparecerá como activa."
            primary
            onClick={() => {
              router.push("/onboarding?step=privada-crear");
            }}
            actionLabel="Crear"
          />
          <ChoiceCard
            icon={<Users className="size-6" />}
            label="Unirse a una quiniela"
            description="Introduce el código de 4 dígitos que te ha pasado el creador."
            footer="También puedes entrar pulsando el invite link directamente."
            onClick={() => {
              router.push("/onboarding?step=privada-unirse");
            }}
            actionLabel="Unirse"
          />
        </div>
      </div>
    );
  }

  if (step === "privada-crear") {
    return (
      <div className="space-y-10">
        <BackButton href="/onboarding?step=privada-elegir" />
        <CreateLeagueForm fresh={fresh} />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <BackButton href="/onboarding?step=privada-elegir" />
      <JoinLeagueForm />
    </div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-10 bg-[var(--color-arena)]" />
      <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        {children}
      </p>
    </div>
  );
}

function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
    >
      <ArrowLeft className="size-3.5" /> Volver
    </Link>
  );
}

function ChoiceCard({
  icon,
  label,
  description,
  footer,
  primary,
  onClick,
  actionLabel,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  footer?: string;
  primary?: boolean;
  onClick: () => void;
  actionLabel: string;
}) {
  const [pending, setPending] = useState(false);
  return (
    <button
      type="button"
      disabled={pending}
      onClick={async () => {
        try {
          setPending(true);
          await onClick();
        } finally {
          setPending(false);
        }
      }}
      className={`group relative flex min-h-[18rem] flex-col items-start gap-5 overflow-hidden rounded-2xl border p-6 text-left transition-all duration-300 ease-out disabled:opacity-60 sm:p-7 lg:min-h-[22rem] lg:p-8 ${
        primary
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_5%,var(--color-surface))] hover:-translate-y-1 hover:border-[var(--color-arena)] hover:shadow-[var(--shadow-arena)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-1 hover:border-[var(--color-arena)]/50 hover:shadow-[var(--shadow-elev-2)]"
      }`}
    >
      {primary ? (
        <div
          className="halftone pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity group-hover:opacity-[0.1]"
          aria-hidden
        />
      ) : null}
      <div
        className={`relative grid size-14 place-items-center rounded-lg transition-transform group-hover:scale-110 ${
          primary
            ? "bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]"
            : "bg-[var(--color-surface-2)] text-[var(--color-arena)]"
        }`}
      >
        {icon}
      </div>
      <div className="relative space-y-2">
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">{label}</h2>
        <p className="text-[0.95rem] leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>
      {footer ? (
        <p className="relative font-editorial text-xs italic text-[var(--color-muted-foreground)]">
          {footer}
        </p>
      ) : null}
      <span className="relative mt-auto inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-arena)] transition-transform group-hover:translate-x-1.5">
        {pending ? "…" : actionLabel} <ArrowRight className="size-3.5" />
      </span>
    </button>
  );
}

// ──────────────────────── Crear ────────────────────────

function CreateLeagueForm({ fresh }: { fresh: boolean }) {
  const [state, action, pending] = useActionState(createLeague, initialCreate);

  if (state.ok && state.league) {
    return (
      <CreatedSuccess
        name={state.league.name}
        joinCode={state.league.joinCode}
        inviteToken={state.league.inviteToken}
      />
    );
  }

  return (
    <div className="space-y-10">
      <Eyebrow>Crear quiniela</Eyebrow>
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl xl:text-6xl">
          ¿Cómo se llamará?
        </h1>
        <p className="font-editorial text-lg italic text-[var(--color-muted-foreground)]">
          Elige un nombre que tu grupo reconozca al verlo. Recibirás un código
          de 4 dígitos y un invite link para compartir.
        </p>
      </header>

      <form action={action} className="space-y-8">
        <FloatingField
          name="name"
          label="Nombre de la quiniela"
          placeholder="Quiniela del Curro 2026"
          required
          maxLength={60}
          autoComplete="off"
          autoFocus
          big
        />
        <FloatingField
          name="description"
          label="Descripción · opcional"
          placeholder="Una frase que la presente"
          maxLength={280}
          autoComplete="off"
        />

        {state.error ? (
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        ) : null}

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
          <Button
            type="submit"
            size="lg"
            className="h-14 px-8 text-base sm:flex-1"
            disabled={pending}
          >
            {pending ? "Creando…" : "Crear quiniela"}
            <ArrowRight />
          </Button>
          {!fresh ? (
            <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)] sm:max-w-[18rem]">
              Quedará añadida a tu lista y será tu liga activa al terminar.
            </p>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function FloatingField({
  name,
  label,
  placeholder,
  required,
  maxLength,
  autoComplete,
  autoFocus,
  big,
}: {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
  autoComplete?: string;
  autoFocus?: boolean;
  big?: boolean;
}) {
  // Input "magazine": label en mono uppercase como rótulo arriba, input
  // grande con borde inferior solo (estética minimal-editorial). Foco
  // resalta la línea inferior con el arena.
  return (
    <label className="group block space-y-2">
      <span className="block font-mono text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition-colors group-focus-within:text-[var(--color-arena)]">
        {label}
      </span>
      <input
        type="text"
        name={name}
        placeholder={placeholder}
        required={required}
        maxLength={maxLength}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        className={`w-full border-0 border-b-2 border-[var(--color-border)] bg-transparent px-0 pb-3 pt-1 text-[var(--color-foreground)] outline-none transition-colors placeholder:text-[var(--color-muted-foreground)]/50 focus:border-[var(--color-arena)] ${
          big ? "font-display text-3xl tracking-tight sm:text-4xl" : "text-lg"
        }`}
      />
    </label>
  );
}

function CreatedSuccess({
  name,
  joinCode,
  inviteToken,
}: {
  name: string;
  joinCode: string | null;
  inviteToken: string;
}) {
  const router = useRouter();
  const inviteUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/invite/${inviteToken}`
      : `/invite/${inviteToken}`;
  return (
    <div className="space-y-10">
      <div className="flex items-center gap-3">
        <Sparkles className="size-4 text-[var(--color-arena)]" />
        <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-arena)]">
          Liga creada
        </p>
      </div>
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl xl:text-6xl">
          {name}
        </h1>
        <p className="font-editorial text-lg italic text-[var(--color-muted-foreground)]">
          Comparte el código o el link. Quien lo use entra contigo.
        </p>
      </header>

      <div className="space-y-6">
        <div className="rounded-2xl border border-[var(--color-arena)]/50 bg-[color-mix(in_oklch,var(--color-arena)_5%,var(--color-surface))] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-4">
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Código de 4 dígitos
            </p>
            <CopyButton value={joinCode ?? "—"} disabled={!joinCode} />
          </div>
          <p className="mt-3 font-display tabular text-7xl tracking-[0.2em] text-[var(--color-arena)] glow-arena sm:text-8xl xl:text-9xl">
            {joinCode ?? "—"}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
                Invite link
              </p>
              <p className="mt-1 truncate font-mono text-sm text-[var(--color-foreground)]">
                {inviteUrl}
              </p>
            </div>
            <CopyButton value={inviteUrl} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 pt-2">
        <Button
          size="lg"
          onClick={() => router.push("/dashboard")}
          className="h-14 px-8 text-base sm:flex-1"
        >
          Ir al dashboard <ArrowRight />
        </Button>
        <Link
          href="/onboarding?step=privada-elegir"
          className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          Crear otra
        </Link>
      </div>
    </div>
  );
}

function CopyButton({ value, disabled }: { value: string; disabled?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (disabled) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("No se pudo copiar");
    }
  };
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={copy}
      disabled={disabled}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
      {copied ? "Copiado" : "Copiar"}
    </Button>
  );
}

// ──────────────────────── Unirse ────────────────────────

function JoinLeagueForm() {
  const [state, action, pending] = useActionState(joinLeagueByCode, initialJoin);
  const [digits, setDigits] = useState<string[]>(["", "", "", ""]);
  const refs = useRef<Array<HTMLInputElement | null>>([null, null, null, null]);

  const code = digits.join("");
  const ready = code.length === 4 && /^\d{4}$/.test(code);

  const handleChange = (i: number, raw: string) => {
    // Solo dígitos. Si el usuario pega "1234", lo distribuimos.
    const cleaned = raw.replace(/\D/g, "");
    if (cleaned.length === 0) {
      const next = [...digits];
      next[i] = "";
      setDigits(next);
      return;
    }
    if (cleaned.length > 1) {
      // Pegado: distribuye desde i.
      const next = [...digits];
      const chars = cleaned.slice(0, 4 - i).split("");
      chars.forEach((c, k) => {
        next[i + k] = c;
      });
      setDigits(next);
      const last = Math.min(3, i + chars.length);
      refs.current[last]?.focus();
      return;
    }
    const next = [...digits];
    next[i] = cleaned;
    setDigits(next);
    if (i < 3) refs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 3) refs.current[i + 1]?.focus();
  };

  return (
    <div className="space-y-10">
      <Eyebrow>Unirse a quiniela</Eyebrow>
      <header className="space-y-4">
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl xl:text-6xl">
          Introduce el código
        </h1>
        <p className="font-editorial text-lg italic text-[var(--color-muted-foreground)]">
          Te lo habrá pasado el creador. Cuatro dígitos.
        </p>
      </header>

      <form action={action}>
        <input type="hidden" name="code" value={code} />

        <div className="space-y-6">
          <div
            className="flex items-center justify-center gap-3 sm:gap-4"
            onPaste={(e) => {
              const text = e.clipboardData.getData("text").replace(/\D/g, "");
              if (text.length > 0) {
                e.preventDefault();
                handleChange(0, text);
              }
            }}
          >
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="\d"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
                aria-label={`Dígito ${i + 1}`}
                className="size-20 rounded-2xl border-2 border-[var(--color-border)] bg-[var(--color-surface)] text-center font-display text-5xl tabular tracking-tight text-[var(--color-foreground)] outline-none transition-all focus:-translate-y-0.5 focus:border-[var(--color-arena)] focus:shadow-[var(--shadow-arena)] sm:size-24 sm:text-6xl xl:size-28 xl:text-7xl"
              />
            ))}
          </div>

          {state.error ? (
            <p className="text-center text-sm text-[var(--color-danger)]">
              {state.error}
            </p>
          ) : null}

          <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center">
            <Button
              type="submit"
              size="lg"
              className="h-14 px-8 text-base sm:flex-1"
              disabled={pending || !ready}
            >
              {pending ? "Comprobando…" : "Unirme"}
              <ArrowRight />
            </Button>
            <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)] sm:max-w-[18rem]">
              ¿Tienes el invite link? Pulsa el enlace directamente — te lleva
              dentro sin pedir código.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
}
