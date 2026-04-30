import Image from "next/image";
import Link from "next/link";
import { Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type TeamLite = {
  id: number;
  code: string;
  name: string;
  flagUrl: string | null;
};

export type BracketMatch = {
  id: number;
  code: string;
  scheduledAt: Date | string;
  homeTeam: TeamLite | null;
  awayTeam: TeamLite | null;
  winnerTeamId: number | null;
  homeScore: number | null;
  awayScore: number | null;
  status: "scheduled" | "live" | "finished";
  wentToPens: boolean;
  homeScorePen: number | null;
  awayScorePen: number | null;
};

type Side = "left" | "right";

type Props = {
  /** All knockout matches keyed by code */
  matches: Map<string, BracketMatch>;
  /** Team ids the user predicted to advance from each round */
  myPicks: {
    r16: Set<number>;
    qf: Set<number>;
    sf: Set<number>;
    finalists: Set<number>;
    championTeamId: number | null;
  };
};

/**
 * Hardcoded FIFA 2026 bracket structure. The order in r32/r16/qf/sf is
 * top-to-bottom for the left half then top-to-bottom for the right half so
 * that, when each column distributes evenly, paired matches sit adjacent and
 * a parent match sits at the vertical midpoint of its two feeders.
 *
 * Source: 2026 FIFA World Cup knockout stage bracket (Wikipedia).
 */
const STRUCTURE = {
  r32: {
    left: ["M74", "M77", "M73", "M75", "M83", "M84", "M81", "M82"],
    right: ["M76", "M78", "M79", "M80", "M86", "M88", "M85", "M87"],
  },
  r16: {
    left: ["M89", "M90", "M93", "M94"],
    right: ["M91", "M92", "M95", "M96"],
  },
  qf: {
    left: ["M97", "M98"],
    right: ["M99", "M100"],
  },
  sf: {
    left: ["M101"],
    right: ["M102"],
  },
  final: "M104",
  third: "M103",
} as const;

export function BracketTree({ matches, myPicks }: Props) {
  return (
    <div
      className="relative w-full overflow-x-auto pb-2"
      style={{ ["--bracket-gap" as string]: "18px" }}
    >
      <div className="grid min-h-[1480px] min-w-[920px] grid-cols-[1fr_1fr_1fr_1fr_minmax(170px,1.1fr)_1fr_1fr_1fr_1fr] gap-x-4">
        {/* LEFT HALF */}
        <Column stage="r32" side="left" matches={matches} myPicks={myPicks} order={STRUCTURE.r32.left} />
        <Column stage="r16" side="left" matches={matches} myPicks={myPicks} order={STRUCTURE.r16.left} />
        <Column stage="qf" side="left" matches={matches} myPicks={myPicks} order={STRUCTURE.qf.left} />
        <Column stage="sf" side="left" matches={matches} myPicks={myPicks} order={STRUCTURE.sf.left} />

        {/* CENTER — final + champion */}
        <FinalColumn matches={matches} myPicks={myPicks} />

        {/* RIGHT HALF */}
        <Column stage="sf" side="right" matches={matches} myPicks={myPicks} order={STRUCTURE.sf.right} />
        <Column stage="qf" side="right" matches={matches} myPicks={myPicks} order={STRUCTURE.qf.right} />
        <Column stage="r16" side="right" matches={matches} myPicks={myPicks} order={STRUCTURE.r16.right} />
        <Column stage="r32" side="right" matches={matches} myPicks={myPicks} order={STRUCTURE.r32.right} />
      </div>
    </div>
  );
}

function Column({
  stage,
  side,
  order,
  matches,
  myPicks,
}: {
  stage: "r32" | "r16" | "qf" | "sf";
  side: Side;
  order: readonly string[];
  matches: Map<string, BracketMatch>;
  myPicks: Props["myPicks"];
}) {
  const stageLabel = STAGE_LABEL[stage];
  // For r32 we group every two matches into a pair (the two feeders for one r16).
  // For r16/qf we also pair (each pair feeds one parent in the next column).
  // For sf there's no pair — it's a single match per side.
  const items: { code: string; pairIndex?: number }[] = order.map((code) => ({ code }));

  return (
    <div className="flex flex-col">
      <ColumnHeader label={stageLabel} side={side} />
      <div className="flex flex-1 flex-col">
        {stage === "sf" ? (
          // single match per side, centered
          <div className="flex flex-1 items-center justify-center">
            <MatchCardWrapper
              code={items[0].code}
              stage={stage}
              side={side}
              matches={matches}
              myPicks={myPicks}
              showIncoming
            />
          </div>
        ) : (
          // pairs
          chunkPairs(items).map((pair, i) => (
            <div
              key={i}
              className={cn(
                "flex flex-1 flex-col justify-around bracket-pair",
                side === "right" && "bracket-pair-right",
              )}
            >
              {pair.map((it) => (
                <MatchCardWrapper
                  key={it.code}
                  code={it.code}
                  stage={stage}
                  side={side}
                  matches={matches}
                  myPicks={myPicks}
                  showIncoming={stage !== "r32"}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function FinalColumn({
  matches,
  myPicks,
}: {
  matches: Map<string, BracketMatch>;
  myPicks: Props["myPicks"];
}) {
  const finalMatch = matches.get(STRUCTURE.final);
  const thirdMatch = matches.get(STRUCTURE.third);
  return (
    <div className="flex flex-col">
      <div className="grid place-items-center pb-3">
        <span className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
          Final
        </span>
      </div>
      <div className="flex flex-1 flex-col items-stretch justify-center gap-6">
        {finalMatch ? (
          <FinalCard match={finalMatch} championTeamId={myPicks.championTeamId} />
        ) : null}
        {thirdMatch ? (
          <ThirdCard match={thirdMatch} />
        ) : null}
      </div>
    </div>
  );
}

function ColumnHeader({ label, side }: { label: string; side: Side }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 pb-3 font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]",
        side === "left" ? "justify-start" : "justify-end",
      )}
    >
      {side === "left" ? (
        <>
          <span className="h-px w-4 bg-[var(--color-arena)]" />
          {label}
        </>
      ) : (
        <>
          {label}
          <span className="h-px w-4 bg-[var(--color-arena)]" />
        </>
      )}
    </div>
  );
}

function MatchCardWrapper({
  code,
  stage,
  side,
  matches,
  myPicks,
  showIncoming,
}: {
  code: string;
  stage: "r32" | "r16" | "qf" | "sf";
  side: Side;
  matches: Map<string, BracketMatch>;
  myPicks: Props["myPicks"];
  showIncoming: boolean;
}) {
  const m = matches.get(code);
  return (
    <div
      className={cn(
        "flex items-center",
        showIncoming &&
          (side === "left" ? "bracket-incoming" : "bracket-incoming-right"),
      )}
    >
      <BracketCard match={m} code={code} stage={stage} myPicks={myPicks} />
    </div>
  );
}

function BracketCard({
  match,
  code,
  stage,
  myPicks,
}: {
  match: BracketMatch | undefined;
  code: string;
  stage: "r32" | "r16" | "qf" | "sf";
  myPicks: Props["myPicks"];
}) {
  // Which set of picks corresponds to "the team I think advances from THIS match"?
  // After r32 → my r16 picks tell me. After r16 → my qf picks. Etc.
  const advancePool: Set<number> | null =
    stage === "r32"
      ? myPicks.r16
      : stage === "r16"
        ? myPicks.qf
        : stage === "qf"
          ? myPicks.sf
          : myPicks.finalists;

  const home = match?.homeTeam ?? null;
  const away = match?.awayTeam ?? null;
  const winnerId = match?.winnerTeamId ?? null;

  const inner = (
    <div className="w-full overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-arena)]/40">
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
        <span>{code}</span>
        {match?.status === "finished" ? (
          <span className="text-[var(--color-success)]">FIN</span>
        ) : match?.status === "live" ? (
          <span className="text-[var(--color-arena)]">LIVE</span>
        ) : null}
      </div>
      <TeamLine
        team={home}
        score={match?.homeScore ?? null}
        isWinner={winnerId != null && home?.id === winnerId}
        isMyPick={home != null && advancePool?.has(home.id) === true}
      />
      <div className="border-t border-dashed border-[var(--color-border)]" />
      <TeamLine
        team={away}
        score={match?.awayScore ?? null}
        isWinner={winnerId != null && away?.id === winnerId}
        isMyPick={away != null && advancePool?.has(away.id) === true}
      />
      {match?.wentToPens ? (
        <p className="border-t border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-0.5 text-center font-mono text-[0.55rem] uppercase tracking-[0.28em] text-[var(--color-muted-foreground)]">
          Pen.: {match.homeScorePen ?? 0} – {match.awayScorePen ?? 0}
        </p>
      ) : null}
    </div>
  );

  if (!match) return inner;
  return (
    <Link href={`/partido/${match.id}`} className="block w-full">
      {inner}
    </Link>
  );
}

function TeamLine({
  team,
  score,
  isWinner,
  isMyPick,
}: {
  team: TeamLite | null;
  score: number | null;
  isWinner: boolean;
  isMyPick: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 px-2 py-1.5",
        isWinner && "bg-[color-mix(in_oklch,var(--color-success)_10%,transparent)]",
      )}
    >
      <div className="flex min-w-0 items-center gap-1.5">
        <span className="grid size-4 shrink-0 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
          {team?.flagUrl ? (
            <Image src={team.flagUrl} alt={team.code} width={16} height={16} />
          ) : null}
        </span>
        <span
          className={cn(
            "truncate text-[0.7rem] font-medium",
            isWinner && "text-[var(--color-success)]",
          )}
        >
          {team?.name ?? "TBD"}
        </span>
        {isMyPick ? (
          <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-[var(--color-arena)]">
            ●
          </span>
        ) : null}
      </div>
      <span className="font-display tabular text-base">
        {score != null ? score : <span className="text-[var(--color-muted-foreground)]">·</span>}
      </span>
    </div>
  );
}

function FinalCard({
  match,
  championTeamId,
}: {
  match: BracketMatch;
  championTeamId: number | null;
}) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-[var(--color-arena)]/50 bg-[color-mix(in_oklch,var(--color-arena)_8%,var(--color-surface))] shadow-[var(--shadow-arena)]">
      <div className="flex items-center justify-between border-b border-[var(--color-arena)]/30 bg-[color-mix(in_oklch,var(--color-arena)_15%,transparent)] px-3 py-1.5 font-mono text-[0.6rem] uppercase tracking-[0.32em]">
        <span className="text-[var(--color-arena)]">FINAL · {match.code}</span>
        <Crown className="size-4 text-[var(--color-arena)]" />
      </div>
      <TeamLine
        team={match.homeTeam}
        score={match.homeScore}
        isWinner={match.winnerTeamId != null && match.homeTeam?.id === match.winnerTeamId}
        isMyPick={match.homeTeam != null && match.homeTeam.id === championTeamId}
      />
      <div className="border-t border-dashed border-[var(--color-border)]" />
      <TeamLine
        team={match.awayTeam}
        score={match.awayScore}
        isWinner={match.winnerTeamId != null && match.awayTeam?.id === match.winnerTeamId}
        isMyPick={match.awayTeam != null && match.awayTeam.id === championTeamId}
      />
    </div>
  );
}

function ThirdCard({ match }: { match: BracketMatch }) {
  return (
    <div className="overflow-hidden rounded-md border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)]">
      <div className="border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-center font-mono text-[0.55rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
        Tercer puesto · {match.code}
      </div>
      <TeamLine
        team={match.homeTeam}
        score={match.homeScore}
        isWinner={match.winnerTeamId != null && match.homeTeam?.id === match.winnerTeamId}
        isMyPick={false}
      />
      <div className="border-t border-dashed border-[var(--color-border)]" />
      <TeamLine
        team={match.awayTeam}
        score={match.awayScore}
        isWinner={match.winnerTeamId != null && match.awayTeam?.id === match.winnerTeamId}
        isMyPick={false}
      />
    </div>
  );
}

function chunkPairs<T>(arr: T[]): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += 2) out.push(arr.slice(i, i + 2));
  return out;
}

const STAGE_LABEL: Record<"r32" | "r16" | "qf" | "sf", string> = {
  r32: "Dieciseisavos",
  r16: "Octavos",
  qf: "Cuartos",
  sf: "Semifinal",
};
