import { DeadlineBanner } from "./deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

/**
 * Server component async que carga el deadline summary y renderiza el
 * banner. Pensado para ir envuelto en un Suspense con fallback de un
 * elemento real (no `null`) desde el layout: el shell se pinta
 * inmediatamente y este nodo aparece (o no) cuando la query termina, sin
 * bloquear la navegación. Evitar `fallback={null}` — los marcadores de
 * comentario que React usa pueden quedar huérfanos cuando una extensión
 * (típicamente Google Translate / Safari Translate) muta el DOM, y `$RS`
 * crashea con "null is not an object (evaluating 'b.parentNode')".
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
