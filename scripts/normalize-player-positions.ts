import { eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";
import { POSITIONS, normalizePosition } from "@/lib/position";

/**
 * Normaliza `players.position` a los códigos canónicos (POR/DEF/MED/DEL).
 * Cubre los valores legacy (GK/DF/MF/FW + Goalkeeper/Defender/Midfielder/Forward).
 *
 *   pnpm db:normalize-positions
 *   pnpm db:normalize-positions --dry-run
 */
const dryRun = process.argv.includes("--dry-run");
const canonicalSet = new Set<string>(POSITIONS);

async function main() {
  const rows = await db
    .select({ id: players.id, position: players.position })
    .from(players)
    .where(isNotNull(players.position));

  const todo = rows
    .map((r) => ({
      id: r.id,
      from: r.position!,
      to: normalizePosition(r.position),
    }))
    .filter((r) => r.to !== r.from);

  const unrecognized = todo.filter((r) => r.to == null);
  const updates = todo.filter((r) => r.to != null);
  const alreadyCanonical = rows.filter(
    (r) => r.position != null && canonicalSet.has(r.position),
  ).length;

  console.log(
    `Total con posición: ${rows.length} · ya canónicos: ${alreadyCanonical} · a actualizar: ${updates.length} · no reconocidos: ${unrecognized.length}`,
  );
  if (unrecognized.length > 0) {
    console.log("No reconocidos (se dejan tal cual):");
    unrecognized.slice(0, 10).forEach((r) => console.log(`  · #${r.id} "${r.from}"`));
  }

  if (dryRun) {
    console.log("--dry-run: no escribo nada.");
    updates.slice(0, 10).forEach((r) => console.log(`  · #${r.id}: ${r.from} → ${r.to}`));
    return;
  }

  for (const r of updates) {
    await db.update(players).set({ position: r.to }).where(eq(players.id, r.id));
  }
  console.log(`✓ ${updates.length} jugadores normalizados.`);

  // Sanity check: no debería quedar ningún valor non-canonical después.
  const stragglers = await db
    .select({ id: players.id, position: players.position })
    .from(players)
    .where(
      isNotNull(players.position),
    );
  const bad = stragglers.filter(
    (r) => r.position != null && !canonicalSet.has(r.position),
  );
  if (bad.length > 0) {
    console.warn(`⚠ Quedan ${bad.length} valores no-canonical (sin mapping definido):`);
    bad.slice(0, 10).forEach((r) => console.warn(`  · #${r.id} "${r.position}"`));
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
