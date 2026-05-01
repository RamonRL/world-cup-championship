import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import postgres from "postgres";

/**
 * Marca migrations existentes como aplicadas en `drizzle.__drizzle_migrations`
 * sin ejecutar su SQL. Útil cuando el esquema se bootstrappeó con
 * `drizzle-kit push` (que NO escribe en la tabla de migraciones) y hay que
 * pasar a usar `drizzle-kit migrate` para futuros cambios.
 *
 * Uso: `pnpm tsx scripts/mark-migration-applied.ts 0000_brave_klaw`
 *      `pnpm tsx scripts/mark-migration-applied.ts 0000_brave_klaw 0001_chemical_betty_ross`
 *
 * Hash y timestamp se calculan exactamente igual que dentro de drizzle-orm
 * (sha256 del contenido del .sql + folderMillis del journal), así la
 * comparación interna `lastDbMigration.created_at >= migration.folderMillis`
 * funciona y los siguientes `migrate` ya saben que está aplicada.
 */

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error(
    "Uso: pnpm tsx scripts/mark-migration-applied.ts <tag> [<tag> ...]\n" +
      'Ej.: pnpm tsx scripts/mark-migration-applied.ts 0000_brave_klaw',
  );
  process.exit(1);
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL no está set. Cárgalo con --env-file=.env.local.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1, prepare: false });

type JournalEntry = { tag: string; when: number };
type Journal = { entries: JournalEntry[] };

async function main() {
  const journal = JSON.parse(
    readFileSync("drizzle/migrations/meta/_journal.json", "utf8"),
  ) as Journal;

  await sql`CREATE SCHEMA IF NOT EXISTS drizzle`;
  await sql`
    CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `;

  for (const tag of args) {
    const entry = journal.entries.find((e) => e.tag === tag);
    if (!entry) {
      console.error(`× Tag ${tag} no existe en el journal. Skipping.`);
      continue;
    }
    const sqlContent = readFileSync(`drizzle/migrations/${tag}.sql`, "utf8");
    const hash = createHash("sha256").update(sqlContent).digest("hex");

    const existing =
      await sql`SELECT id FROM drizzle.__drizzle_migrations WHERE hash = ${hash}`;
    if (existing.length > 0) {
      console.log(`· ${tag}: ya marcado, skip`);
      continue;
    }

    await sql`
      INSERT INTO drizzle.__drizzle_migrations ("hash", "created_at")
      VALUES (${hash}, ${entry.when})
    `;
    console.log(`✓ ${tag} marcado (hash=${hash.slice(0, 12)}…, when=${entry.when})`);
  }

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
