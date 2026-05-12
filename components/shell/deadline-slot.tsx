import { DeadlineBanner } from "./deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

/**
 * Server component async que carga el deadline summary y renderiza el
 * banner. Pensado para ir envuelto en `<Suspense fallback={null}>` desde el
 * layout: el shell se pinta inmediatamente y este nodo aparece (o no)
 * cuando la query termina, sin bloquear la navegación.
 */
export async function DeadlineSlot({
  userId,
  leagueId,
}: {
  userId: string;
  leagueId: number;
}) {
  const { imminent } = await loadDeadlineSummary(userId, leagueId);
  return <DeadlineBanner deadline={imminent} />;
}
