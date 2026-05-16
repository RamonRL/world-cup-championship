import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/shell/page-header";
import { getCurrentUser } from "@/lib/auth/guards";
import { findGame } from "../_lib/games";
import { loadMyBestScore, loadScoreboard } from "../_lib/scores";
import { MinigameScoreTable } from "../_shared/score-table";
import { QuienEsQuienClient } from "./game-client";

const SLUG = "quien-es-quien";

export const metadata = {
  title: "¿Quién es quién? · Minijuegos",
  description: "Adivina los jugadores del Mundial 2026 en 60 segundos.",
};

export const revalidate = 30;

export default async function QuienEsQuienPage() {
  const game = findGame(SLUG)!;
  const me = await getCurrentUser();
  const myIdentityKey = me?.id ?? null;

  const [rows, myBest] = await Promise.all([
    loadScoreboard(game.gameKey, 50),
    myIdentityKey ? loadMyBestScore(game.gameKey, myIdentityKey) : Promise.resolve(null),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/minijuegos"
        className="inline-flex items-center gap-1.5 font-mono text-[0.65rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)] transition hover:text-[var(--color-foreground)]"
      >
        <ArrowLeft className="size-3.5" />
        Volver a minijuegos
      </Link>

      <PageHeader
        eyebrow="Minijuegos"
        title={game.name}
        description={game.description}
      />

      <QuienEsQuienClient myIdentityKey={myIdentityKey} myBestScore={myBest} />

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="h-px w-6 bg-[var(--color-arena)]" />
          <h2 className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
            Ranking global · top {rows.length}
          </h2>
          <span className="h-px flex-1 bg-[var(--color-border)]" />
        </div>
        <MinigameScoreTable
          rows={rows}
          highlightIdentityKey={myIdentityKey}
          emptyMessage="Aún no hay puntuaciones. Sé el primero en jugar."
        />
        <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.24em] text-[var(--color-muted-foreground)]">
          Solo se guarda tu mejor puntuación
        </p>
      </section>
    </div>
  );
}
