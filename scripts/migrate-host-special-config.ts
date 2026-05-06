import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { specialPredictions } from "@/lib/db/schema";
import { recomputeSpecialPredictionForAllUsers } from "@/lib/scoring/persistence";

/**
 * Migra la configuración del especial `host_furthest_round` al nuevo formato:
 *   { correct: 3, exactRoundBonus: 5 }
 *
 * Antiguo: { maxPoints, perRound: { r32:1, r16:2, qf:4, sf:6, final:7, champion:8 } }
 *
 * Idempotente: si ya está en el formato nuevo, no hace nada. Tras actualizar
 * la fila, recompute los puntos para los participantes que ya hubieran
 * predicho.
 *
 *   pnpm db:migrate-host-special
 *   pnpm db:migrate-host-special --dry-run
 */
const dryRun = process.argv.includes("--dry-run");

async function main() {
  const [row] = await db
    .select()
    .from(specialPredictions)
    .where(eq(specialPredictions.key, "host_furthest_round"))
    .limit(1);
  if (!row) {
    console.log("No existe el special 'host_furthest_round'. Nada que migrar.");
    return;
  }

  const cfg = row.pointsConfigJson as Record<string, unknown> | null;
  if (cfg && typeof cfg.correct === "number") {
    console.log("Ya estaba en el formato nuevo. Nada que migrar.");
    return;
  }

  const next = { correct: 3, exactRoundBonus: 5 };
  console.log(`Migrating special #${row.id} (${row.key}):`);
  console.log("  antes:", JSON.stringify(cfg));
  console.log("  ahora:", JSON.stringify(next));

  if (dryRun) {
    console.log("--dry-run: no escribo nada.");
    return;
  }

  await db
    .update(specialPredictions)
    .set({ pointsConfigJson: next })
    .where(eq(specialPredictions.id, row.id));
  await recomputeSpecialPredictionForAllUsers(row.id);
  console.log("✓ Config actualizada y puntos recalculados.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
