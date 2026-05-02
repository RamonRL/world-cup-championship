import {
  countAnyPicksInLeague,
  findLeaguesWithPicks,
  type LeagueWithPicks,
} from "@/lib/import-predictions";
import { ImportBannerClient } from "./import-banner-client";

/**
 * Server component que decide si renderizar el banner. Se muestra cuando:
 *   - el usuario NO tiene picks en la liga activa (target vacío), Y
 *   - tiene picks en al menos otra liga suya (origen disponible).
 * En cualquier otro caso devuelve null.
 */
export async function ImportPredictionsBanner({
  userId,
  activeLeagueId,
}: {
  userId: string;
  activeLeagueId: number;
}) {
  const [activePicks, otherLeagues] = await Promise.all([
    countAnyPicksInLeague(userId, activeLeagueId),
    findLeaguesWithPicks(userId, activeLeagueId),
  ]);

  if (activePicks > 0) return null;
  if (otherLeagues.length === 0) return null;

  return <ImportBannerClient sources={otherLeagues} />;
}

export type { LeagueWithPicks };
