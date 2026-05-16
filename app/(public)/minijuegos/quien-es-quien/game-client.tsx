"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, Clock, Trophy, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamFlag } from "@/components/brand/team-flag";
import { cn } from "@/lib/utils";
import {
  NicknameGate,
  getStoredGuestNickname,
} from "../_components/nickname-gate";
import { startRound, submitScore, type Round, type RoundOption } from "./actions";

const GAME_SECONDS = 60;

type Props = {
  /** identityKey del usuario logueado, o null si visita pública. */
  myIdentityKey: string | null;
  /** Mejor puntuación previa del logueado (null si aún no jugó). */
  myBestScore: number | null;
};

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | { kind: "playing"; rounds: Round[]; token: string; index: number; choices: ChosenAnswer[] }
  | { kind: "submitting"; rounds: Round[]; token: string; choices: ChosenAnswer[] }
  | {
      kind: "done";
      score: number;
      previousBest: number | null;
      improved: boolean;
      rank: number;
      totalParticipants: number;
    }
  | { kind: "error"; message: string };

type ChosenAnswer = { roundId: number; chosenPlayerId: number };

export function QuienEsQuienClient({ myIdentityKey, myBestScore }: Props) {
  const isGuest = myIdentityKey == null;
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [secondsLeft, setSecondsLeft] = useState(GAME_SECONDS);
  const [showGate, setShowGate] = useState(false);
  const phaseRef = useRef<Phase>(phase);
  phaseRef.current = phase;

  // Timer global de la partida. Usamos un setInterval con tick por segundo;
  // suficiente para mostrar la cuenta atrás. La verdad del fin es el reloj
  // de pared (`startedAt + 60s`) por si el tab se desactiva un momento.
  useEffect(() => {
    if (phase.kind !== "playing") return;
    const startedAt = Date.now();
    setSecondsLeft(GAME_SECONDS);
    const id = window.setInterval(() => {
      const left = Math.max(0, GAME_SECONDS - Math.floor((Date.now() - startedAt) / 1000));
      setSecondsLeft(left);
      if (left <= 0) {
        const current = phaseRef.current;
        if (current.kind === "playing") {
          finishGame(current);
        }
      }
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.kind === "playing" ? (phase as { token: string }).token : null]);

  const beginGame = useCallback(async () => {
    setPhase({ kind: "starting" });
    try {
      const res = await startRound();
      if (!res.ok) {
        setPhase({ kind: "error", message: res.error });
        return;
      }
      preloadPhotos(res.rounds.slice(0, 8));
      setPhase({
        kind: "playing",
        rounds: res.rounds,
        token: res.token,
        index: 0,
        choices: [],
      });
    } catch (err) {
      setPhase({
        kind: "error",
        message: err instanceof Error ? err.message : "No se pudo iniciar la partida.",
      });
    }
  }, []);

  const handlePlayClick = () => {
    if (isGuest) {
      const stored = getStoredGuestNickname();
      if (stored) {
        void beginGame();
        return;
      }
      setShowGate(true);
      return;
    }
    void beginGame();
  };

  const handleGateConfirm = () => {
    setShowGate(false);
    void beginGame();
  };

  const handleChoose = (option: RoundOption) => {
    setPhase((current) => {
      if (current.kind !== "playing") return current;
      const round = current.rounds[current.index];
      if (!round) return current;
      // El servidor decide si es acierto al hacer submit (no enviamos la
      // respuesta correcta al cliente para que no se pueda hacer trampa).
      // Aquí solo registramos la elección y avanzamos.
      const newChoices = [
        ...current.choices,
        { roundId: round.roundId, chosenPlayerId: option.playerId },
      ];
      const nextIndex = current.index + 1;
      if (nextIndex >= current.rounds.length) {
        // Sin rondas — terminamos antes de que se agote el timer.
        finishGame({ ...current, choices: newChoices });
        return { ...current, choices: newChoices };
      }
      // Prefetch ligero de la siguiente foto.
      preloadPhotos(current.rounds.slice(nextIndex, nextIndex + 2));
      return { ...current, index: nextIndex, choices: newChoices };
    });
  };

  const finishGame = useCallback(
    async (state: Extract<Phase, { kind: "playing" }>) => {
      setPhase({
        kind: "submitting",
        rounds: state.rounds,
        token: state.token,
        choices: state.choices,
      });
      try {
        const res = await submitScore({
          token: state.token,
          answers: state.choices,
          nickname: isGuest ? getStoredGuestNickname() ?? undefined : undefined,
        });
        if (!res.ok) {
          setPhase({ kind: "error", message: res.error });
          return;
        }
        setPhase({
          kind: "done",
          score: res.score,
          previousBest: res.previousBest,
          improved: res.improved,
          rank: res.rank,
          totalParticipants: res.totalParticipants,
        });
      } catch (err) {
        setPhase({
          kind: "error",
          message: err instanceof Error ? err.message : "No se pudo enviar tu puntuación.",
        });
      }
    },
    [isGuest],
  );

  // ───────────────────────── render ─────────────────────────

  if (phase.kind === "idle" || phase.kind === "error") {
    return (
      <>
        <IntroPanel
          myBestScore={myBestScore}
          onPlay={handlePlayClick}
          errorMessage={phase.kind === "error" ? phase.message : null}
        />
        <NicknameGate
          enabled={isGuest}
          open={showGate}
          onConfirm={handleGateConfirm}
          onCancel={() => setShowGate(false)}
        />
      </>
    );
  }

  if (phase.kind === "starting") {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          Preparando partida…
        </p>
      </div>
    );
  }

  if (phase.kind === "submitting") {
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12">
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          Calculando tu puntuación…
        </p>
      </div>
    );
  }

  if (phase.kind === "done") {
    return (
      <ResultPanel
        score={phase.score}
        previousBest={phase.previousBest}
        improved={phase.improved}
        rank={phase.rank}
        totalParticipants={phase.totalParticipants}
        onPlayAgain={() => setPhase({ kind: "idle" })}
      />
    );
  }

  // playing
  const round = phase.rounds[phase.index]!;
  const answered = phase.choices.length;
  return (
    <PlayPanel
      round={round}
      roundNumber={phase.index + 1}
      totalRounds={phase.rounds.length}
      answered={answered}
      secondsLeft={secondsLeft}
      onChoose={handleChoose}
    />
  );
}

function IntroPanel({
  myBestScore,
  onPlay,
  errorMessage,
}: {
  myBestScore: number | null;
  onPlay: () => void;
  errorMessage: string | null;
}) {
  return (
    <div className="flex flex-col items-center gap-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
      <div className="space-y-2">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          60 segundos · cuantos más aciertos, mejor
        </p>
        <h2 className="font-display text-3xl tracking-tight sm:text-4xl">
          ¿Listo para empezar?
        </h2>
        <p className="max-w-md font-editorial text-base italic text-[var(--color-muted-foreground)]">
          Aparecerán caras de jugadores. Elige el nombre correcto entre cuatro
          opciones. Aciertes o falles, pasamos a la siguiente.
        </p>
      </div>
      {myBestScore != null ? (
        <p className="font-mono text-[0.7rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          Tu mejor:{" "}
          <span className="font-display text-2xl tabular text-[var(--color-arena)]">
            {myBestScore}
          </span>
        </p>
      ) : null}
      <Button size="lg" onClick={onPlay}>
        Empezar
      </Button>
      {errorMessage ? (
        <p className="rounded-md border border-[var(--color-danger)]/40 bg-[color-mix(in_oklch,var(--color-danger)_8%,transparent)] px-3 py-2 font-mono text-[0.7rem] uppercase tracking-[0.18em] text-[var(--color-danger)]">
          {errorMessage}
        </p>
      ) : null}
    </div>
  );
}

function PlayPanel({
  round,
  roundNumber,
  totalRounds,
  answered,
  secondsLeft,
  onChoose,
}: {
  round: Round;
  roundNumber: number;
  totalRounds: number;
  answered: number;
  secondsLeft: number;
  onChoose: (option: RoundOption) => void;
}) {
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / GAME_SECONDS) * 100));
  const lowTime = secondsLeft <= 10;
  return (
    <div className="space-y-5">
      {/* HUD: timer + contador */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Clock
            className={cn(
              "size-4",
              lowTime ? "text-[var(--color-danger)]" : "text-[var(--color-arena)]",
            )}
          />
          <span
            className={cn(
              "font-display text-2xl tabular leading-none",
              lowTime ? "text-[var(--color-danger)]" : "text-[var(--color-foreground)]",
            )}
          >
            {secondsLeft}s
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Ronda
          </span>
          <span className="font-display text-lg tabular">
            {roundNumber}
            <span className="text-[var(--color-muted-foreground)]"> / {totalRounds}</span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Respondidas
          </span>
          <span className="font-display text-lg tabular">{answered}</span>
        </div>
      </div>

      {/* Barra de tiempo */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className={cn(
            "h-full transition-[width] duration-200 ease-linear",
            lowTime ? "bg-[var(--color-danger)]" : "bg-[var(--color-arena)]",
          )}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Foto */}
      <div className="relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-2)]">
        <Image
          key={round.roundId}
          src={round.photoUrl}
          alt=""
          fill
          sizes="(max-width: 640px) 90vw, 24rem"
          className="object-cover"
          priority={roundNumber <= 2}
          unoptimized
        />
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {round.options.map((opt) => (
          <button
            key={opt.playerId}
            type="button"
            onClick={() => onChoose(opt)}
            className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3.5 text-left transition hover:-translate-y-0.5 hover:border-[var(--color-arena)]/60 hover:shadow-[var(--shadow-elev-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-arena)]"
          >
            <TeamFlag code={opt.teamCode} size={28} />
            <span className="truncate text-sm font-medium">{opt.name}</span>
            <ArrowRight className="ml-auto size-4 text-[var(--color-muted-foreground)] transition group-hover:translate-x-0.5 group-hover:text-[var(--color-arena)]" />
          </button>
        ))}
      </div>
    </div>
  );
}

function ResultPanel({
  score,
  previousBest,
  improved,
  rank,
  totalParticipants,
  onPlayAgain,
}: {
  score: number;
  previousBest: number | null;
  improved: boolean;
  rank: number;
  totalParticipants: number;
  onPlayAgain: () => void;
}) {
  return (
    <div className="space-y-6 rounded-xl border border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))] p-8 text-center">
      <div className="space-y-1">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          Tu puntuación
        </p>
        <p className="font-display text-7xl tabular leading-none text-[var(--color-arena)] glow-arena">
          {score}
        </p>
        <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
          {improved
            ? previousBest != null
              ? `Récord nuevo · superas tu mejor de ${previousBest}`
              : "Tu primer registro · ya estás en el ranking"
            : `Tu mejor sigue siendo ${previousBest ?? score}`}
        </p>
      </div>

      <div className="mx-auto grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left">
          <div className="flex items-center gap-2 text-[var(--color-arena)]">
            <Trophy className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">
              Posición
            </p>
          </div>
          <p className="mt-1 font-display text-3xl tabular">#{rank}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left">
          <div className="flex items-center gap-2 text-[var(--color-arena)]">
            <Users2 className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">
              Jugadores
            </p>
          </div>
          <p className="mt-1 font-display text-3xl tabular">{totalParticipants}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button size="lg" onClick={onPlayAgain}>
          Jugar otra vez
        </Button>
      </div>
    </div>
  );
}

/**
 * Prefetch silencioso de fotos en background. Usamos `Image` constructor
 * para que el navegador las cachee antes de que el jugador llegue a la
 * ronda — evita el flicker entre cara y cara.
 */
function preloadPhotos(rounds: Round[]) {
  if (typeof window === "undefined") return;
  for (const r of rounds) {
    const img = new window.Image();
    img.src = r.photoUrl;
  }
}
