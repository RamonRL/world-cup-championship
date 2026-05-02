"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="space-y-8">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--color-arena)]" />
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Onboarding
            </p>
          </div>
          <h1 className="font-display text-5xl tracking-tight sm:text-6xl">
            {userNickname ? `Hola, ${userNickname}` : "Bienvenido a la quiniela"}
          </h1>
          <p className="font-editorial text-lg italic text-[var(--color-muted-foreground)]">
            ¿En qué quiniela quieres participar?
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon={<Globe className="size-5" />}
            label="Quiniela Pública"
            description="La gran liga abierta donde compite todo el mundo que no esté en una privada."
            footer="Recomendada si vienes solo y quieres comparar tu pulso con el de la comunidad entera."
            primary
            onClick={async () => {
              await chooseActivePublic();
            }}
            actionLabel="Entrar"
          />
          <ChoiceCard
            icon={<Lock className="size-5" />}
            label="Quiniela Privada"
            description="Crea una nueva quiniela para tu grupo o únete con un código de 4 dígitos."
            footer="Pensado para amigos, oficinas, peñas. Hasta 5 ligas privadas por usuario."
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
      <div className="space-y-8">
        <BackButton href={fresh ? "/onboarding" : "/dashboard"} />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--color-arena)]" />
            <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Quiniela privada
            </p>
          </div>
          <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
            ¿Crear una nueva o unirte a una existente?
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ChoiceCard
            icon={<Plus className="size-5" />}
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
            icon={<Users className="size-5" />}
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
      <div className="space-y-8">
        <BackButton href="/onboarding?step=privada-elegir" />
        <CreateLeagueForm fresh={fresh} />
      </div>
    );
  }

  // privada-unirse
  return (
    <div className="space-y-8">
      <BackButton href="/onboarding?step=privada-elegir" />
      <JoinLeagueForm />
    </div>
  );
}

function BackButton({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-2 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
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
      className={`group relative flex flex-col items-start gap-4 rounded-2xl border p-6 text-left transition disabled:opacity-60 ${
        primary
          ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))] hover:border-[var(--color-arena)] hover:shadow-[var(--shadow-arena)]"
          : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-arena)]/40"
      }`}
    >
      <div
        className={`grid size-11 place-items-center rounded-md ${
          primary
            ? "bg-[var(--color-arena)] text-white"
            : "bg-[var(--color-surface-2)] text-[var(--color-arena)]"
        }`}
      >
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="font-display text-2xl tracking-tight">{label}</h2>
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {description}
        </p>
      </div>
      {footer ? (
        <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)]">
          {footer}
        </p>
      ) : null}
      <span className="mt-auto inline-flex items-center gap-1 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)] transition-transform group-hover:translate-x-1">
        {pending ? "…" : actionLabel} <ArrowRight className="size-3" />
      </span>
    </button>
  );
}

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
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--color-arena)]" />
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Crear quiniela
          </p>
        </div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          ¿Cómo se llamará tu quiniela?
        </h1>
        <p className="font-editorial text-base italic text-[var(--color-muted-foreground)]">
          Elige un nombre que tu grupo reconozca al verlo.
        </p>
      </div>

      <form action={action} className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-xs uppercase tracking-wider">
            Nombre
          </Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Quiniela del Curro 2026"
            maxLength={60}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description" className="text-xs uppercase tracking-wider">
            Descripción <span className="text-[var(--color-muted-foreground)]">(opcional)</span>
          </Label>
          <Input
            id="description"
            name="description"
            placeholder="Una frase para presentarla"
            maxLength={280}
          />
        </div>
        {state.error ? (
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Creando…" : "Crear quiniela"}
          <ArrowRight />
        </Button>
        {!fresh ? (
          <p className="text-center font-editorial text-xs italic text-[var(--color-muted-foreground)]">
            Quedará añadida a tu lista y será tu liga activa al terminar.
          </p>
        ) : null}
      </form>
    </div>
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
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Sparkles className="size-4 text-[var(--color-arena)]" />
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-arena)]">
            Liga creada
          </p>
        </div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">{name}</h1>
        <p className="font-editorial text-base italic text-[var(--color-muted-foreground)]">
          Comparte el código o el link para que tus amigos se unan.
        </p>
      </div>

      <div className="space-y-4 rounded-2xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))] p-6">
        <CopyRow
          label="Código de 4 dígitos"
          value={joinCode ?? "—"}
          big
          disabled={!joinCode}
        />
        <CopyRow label="Invite link" value={inviteUrl} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          size="lg"
          onClick={() => router.push("/dashboard")}
          className="flex-1 sm:flex-none"
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

function CopyRow({
  label,
  value,
  big,
  disabled,
}: {
  label: string;
  value: string;
  big?: boolean;
  disabled?: boolean;
}) {
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
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          {label}
        </p>
        <p
          className={
            big
              ? "font-display tabular text-4xl tracking-[0.18em] text-[var(--color-arena)] glow-arena"
              : "truncate text-sm"
          }
        >
          {value}
        </p>
      </div>
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
    </div>
  );
}

function JoinLeagueForm() {
  const [state, action, pending] = useActionState(joinLeagueByCode, initialJoin);
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-[var(--color-arena)]" />
          <p className="font-mono text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Unirse a quiniela
          </p>
        </div>
        <h1 className="font-display text-4xl tracking-tight sm:text-5xl">
          Introduce el código
        </h1>
        <p className="font-editorial text-base italic text-[var(--color-muted-foreground)]">
          Te lo habrá pasado el creador. Son 4 dígitos.
        </p>
      </div>

      <form
        action={action}
        className="space-y-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6"
      >
        <div className="space-y-2">
          <Label htmlFor="code" className="text-xs uppercase tracking-wider">
            Código
          </Label>
          <Input
            id="code"
            name="code"
            required
            inputMode="numeric"
            pattern="\d{4}"
            maxLength={4}
            minLength={4}
            placeholder="0000"
            autoComplete="off"
            className="text-center font-display text-4xl tabular tracking-[0.5em]"
          />
        </div>
        {state.error ? (
          <p className="text-sm text-[var(--color-danger)]">{state.error}</p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending ? "Comprobando…" : "Unirme"}
          <ArrowRight />
        </Button>
      </form>
    </div>
  );
}
