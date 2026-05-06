import { recomputeAllMatchdayDeadlines } from "@/lib/matchday-deadlines";

/**
 * Backfill: pone matchdays.prediction_deadline_at = MIN(matches.scheduled_at)
 * de todos los partidos de cada jornada. Idempotente.
 *
 *   pnpm db:recompute-matchday-deadlines
 */
async function main() {
  await recomputeAllMatchdayDeadlines();
  console.log("✓ Cierres de jornada recomputados.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
