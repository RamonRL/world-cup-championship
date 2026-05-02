/**
 * One-shot post-migration: rellenar `leagues.join_code` para todas las ligas
 * privadas existentes que aún no lo tienen. La pública queda con NULL.
 *
 * Idempotente: vuelve a correr no hace nada si ya están todos los códigos
 * generados. Se llama justo después de aplicar la migración 0002.
 */
import { eq, isNull, and } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues } from "@/lib/db/schema";

async function generateUniqueJoinCode(): Promise<string> {
  for (let attempt = 0; attempt < 50; attempt++) {
    const code = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const [exists] = await db
      .select({ id: leagues.id })
      .from(leagues)
      .where(eq(leagues.joinCode, code))
      .limit(1);
    if (!exists) return code;
  }
  throw new Error("No se pudo generar un código único tras 50 intentos.");
}

async function main() {
  const privateLeagues = await db
    .select({ id: leagues.id, name: leagues.name })
    .from(leagues)
    .where(and(eq(leagues.isPublic, false), isNull(leagues.joinCode)));

  if (privateLeagues.length === 0) {
    console.log("→ Sin ligas privadas pendientes de joinCode. Done.");
    return;
  }

  console.log(`→ ${privateLeagues.length} ligas privadas necesitan joinCode.`);
  for (const l of privateLeagues) {
    const code = await generateUniqueJoinCode();
    await db.update(leagues).set({ joinCode: code }).where(eq(leagues.id, l.id));
    console.log(`  · ${l.name.padEnd(40, " ")} → ${code}`);
  }
  console.log("✓ Done.");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
