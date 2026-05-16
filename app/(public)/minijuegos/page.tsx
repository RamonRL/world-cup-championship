import { PageHeader } from "@/components/shell/page-header";
import { getCurrentUser } from "@/lib/auth/guards";
import { MINIGAMES } from "./_lib/games";
import { MinigameCard } from "./_components/minigame-card";
import { countParticipants, loadMyBestScore } from "./_lib/scores";

export const metadata = {
  title: "Minijuegos",
  description:
    "Mini-juegos del Mundial 2026: pásalo bien y compite por la mejor puntuación global.",
};

export const revalidate = 60;

export default async function MinijuegosHubPage() {
  const me = await getCurrentUser();
  const myIdentityKey = me?.id ?? null;

  // Carga en paralelo los contadores + mejor score por juego. Solo cargamos
  // "myBest" si hay sesión (los invitados no tienen identidad persistente
  // server-side; su localStorage es solo del cliente).
  const cards = await Promise.all(
    MINIGAMES.map(async (game) => {
      if (game.status === "soon") {
        return { game, myBestScore: null, totalParticipants: 0 };
      }
      const [totalParticipants, myBestScore] = await Promise.all([
        countParticipants(game.gameKey),
        myIdentityKey ? loadMyBestScore(game.gameKey, myIdentityKey) : Promise.resolve(null),
      ]);
      return { game, myBestScore, totalParticipants };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Comunidad"
        title="Minijuegos"
        description="Partidas rápidas para matar tiempo y competir con el resto. Ranking global por juego — invita a los tuyos y sube en la tabla."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map(({ game, myBestScore, totalParticipants }) => (
          <MinigameCard
            key={game.slug}
            game={game}
            myBestScore={myBestScore}
            totalParticipants={totalParticipants}
          />
        ))}
      </div>

      {!me ? (
        <p className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]/60 px-4 py-3 text-center font-editorial text-sm italic text-[var(--color-muted-foreground)]">
          Sin sesión también puedes jugar — solo te pedimos un apodo para
          aparecer en el ranking.
        </p>
      ) : null}
    </div>
  );
}
