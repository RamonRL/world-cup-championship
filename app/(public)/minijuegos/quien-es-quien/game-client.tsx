"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Check, Clock, Target, Trophy, Users2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TeamFlag } from "@/components/brand/team-flag";
import { cn } from "@/lib/utils";
import {
  NicknameGate,
  getStoredGuestNickname,
} from "../_components/nickname-gate";
import { startRound, submitScore, type Round, type RoundOption } from "./actions";

const GAME_SECONDS = 60;
/** Tiempo que se queda visible el feedback verde/rojo antes de avanzar. */
const REVEAL_MS = 450;

type Props = {
  myIdentityKey: string | null;
  myBestScore: number | null;
};

type RevealState = { chosenPlayerId: number; isCorrect: boolean };

type Phase =
  | { kind: "idle" }
  | { kind: "starting" }
  | {
      kind: "playing";
      rounds: Round[];
      token: string;
      index: number;
      choices: ChosenAnswer[];
      correctCount: number;
      reveal: RevealState | null;
    }
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
  const revealTimerRef = useRef<number | null>(null);

  // Timer global de la partida. Tick a 250ms; el reloj de pared
  // (`startedAt + 60s`) es la verdad por si el tab se desactiva un momento.
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

  // Limpiamos cualquier timer de reveal pendiente al desmontar / cambiar fase.
  useEffect(
    () => () => {
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    },
    [],
  );

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
        correctCount: 0,
        reveal: null,
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

  const advance = useCallback(() => {
    setPhase((current) => {
      if (current.kind !== "playing") return current;
      const nextIndex = current.index + 1;
      if (nextIndex >= current.rounds.length) {
        finishGame(current);
        return current;
      }
      preloadPhotos(current.rounds.slice(nextIndex, nextIndex + 2));
      return { ...current, index: nextIndex, reveal: null };
    });
  }, []);

  const handleChoose = (option: RoundOption) => {
    setPhase((current) => {
      if (current.kind !== "playing") return current;
      // Si ya hay un reveal activo en esta ronda, ignoramos el tap (evita
      // contar doble si el jugador hace clic en otra opción mientras se
      // muestra el feedback).
      if (current.reveal) return current;
      const round = current.rounds[current.index];
      if (!round) return current;
      const isCorrect = option.playerId === round.correctPlayerId;
      const newChoices = [
        ...current.choices,
        { roundId: round.roundId, chosenPlayerId: option.playerId },
      ];

      // Programa el avance tras la ventana de feedback. Lo hacemos aquí
      // (dentro del updater) para arrancar el timer en el mismo tick que
      // el cambio de estado.
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = window.setTimeout(() => {
        advance();
      }, REVEAL_MS);

      return {
        ...current,
        choices: newChoices,
        correctCount: current.correctCount + (isCorrect ? 1 : 0),
        reveal: { chosenPlayerId: option.playerId, isCorrect },
      };
    });
  };

  const finishGame = useCallback(
    async (state: Extract<Phase, { kind: "playing" }>) => {
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
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
  return (
    <PlayPanel
      round={round}
      roundNumber={phase.index + 1}
      totalRounds={phase.rounds.length}
      correctCount={phase.correctCount}
      answered={phase.choices.length}
      secondsLeft={secondsLeft}
      reveal={phase.reveal}
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
          opciones. Verás al instante si has acertado.
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
  correctCount,
  answered,
  secondsLeft,
  reveal,
  onChoose,
}: {
  round: Round;
  roundNumber: number;
  totalRounds: number;
  correctCount: number;
  answered: number;
  secondsLeft: number;
  reveal: RevealState | null;
  onChoose: (option: RoundOption) => void;
}) {
  const progressPct = Math.max(0, Math.min(100, (secondsLeft / GAME_SECONDS) * 100));
  const lowTime = secondsLeft <= 10;
  const failed = answered - correctCount;

  return (
    <div className="space-y-5">
      {/* HUD: timer + aciertos + ronda */}
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

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Target className="size-3.5 text-emerald-500" />
            <span className="font-display text-lg tabular text-emerald-500">
              {correctCount}
            </span>
          </span>
          {failed > 0 ? (
            <span className="flex items-center gap-1 font-mono text-[0.65rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
              <X className="size-3" />
              {failed}
            </span>
          ) : null}
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
      <div
        className={cn(
          "relative mx-auto aspect-square w-full max-w-sm overflow-hidden rounded-xl border bg-[var(--color-surface-2)] transition-colors",
          reveal == null
            ? "border-[var(--color-border)]"
            : reveal.isCorrect
              ? "border-emerald-500/70 ring-2 ring-emerald-500/40"
              : "border-[var(--color-danger)]/70 ring-2 ring-[var(--color-danger)]/40",
        )}
      >
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
        {reveal != null ? (
          <span
            aria-hidden
            className={cn(
              "absolute right-3 top-3 grid size-10 place-items-center rounded-full text-white shadow-lg",
              reveal.isCorrect ? "bg-emerald-500" : "bg-[var(--color-danger)]",
            )}
          >
            {reveal.isCorrect ? <Check className="size-5" /> : <X className="size-5" />}
          </span>
        ) : null}
      </div>

      {/* Opciones */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {round.options.map((opt) => {
          const isChosen = reveal?.chosenPlayerId === opt.playerId;
          const isCorrect = opt.playerId === round.correctPlayerId;
          // Durante el reveal mostramos:
          // - chosen: verde si correcto, rojo si no.
          // - correct (no chosen): borde verde tenue para que el usuario
          //   vea cuál era la buena cuando ha fallado.
          // - resto: opacidad reducida.
          let stateClass = "";
          if (reveal != null) {
            if (isChosen) {
              stateClass = reveal.isCorrect
                ? "border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-[var(--color-danger)] bg-[var(--color-danger)]/10 text-[var(--color-danger)]";
            } else if (isCorrect && !reveal.isCorrect) {
              stateClass =
                "border-emerald-500/70 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300";
            } else {
              stateClass = "opacity-60";
            }
          }
          return (
            <button
              key={opt.playerId}
              type="button"
              disabled={reveal != null}
              onClick={() => onChoose(opt)}
              className={cn(
                "group flex items-center gap-3 rounded-lg border px-4 py-3.5 text-left transition disabled:cursor-default",
                reveal == null
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] hover:-translate-y-0.5 hover:border-[var(--color-arena)]/60 hover:shadow-[var(--shadow-elev-2)]"
                  : "bg-[var(--color-surface)]",
                stateClass,
              )}
            >
              <TeamFlag code={opt.teamCode} size={28} />
              <span className="truncate text-sm font-medium">{opt.name}</span>
              {reveal != null && isChosen ? (
                reveal.isCorrect ? (
                  <Check className="ml-auto size-4 text-emerald-500" />
                ) : (
                  <X className="ml-auto size-4 text-[var(--color-danger)]" />
                )
              ) : reveal != null && isCorrect ? (
                <Check className="ml-auto size-4 text-emerald-500" />
              ) : null}
            </button>
          );
        })}
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
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">Posición</p>
          </div>
          <p className="mt-1 font-display text-3xl tabular">#{rank}</p>
        </div>
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 text-left">
          <div className="flex items-center gap-2 text-[var(--color-arena)]">
            <Users2 className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.28em]">Jugadores</p>
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
