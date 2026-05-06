import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import postgres from "postgres";

/**
 * Aplica `supabase/setup.sql` contra la BD: habilita RLS en todas las tablas
 * `public.*` y reescribe las policies. Idempotente — todos los `drop policy
 * if exists` + `create policy` están preparados para correrse N veces.
 *
 * Hay que correrlo cada vez que se añade una tabla nueva al schema (drizzle
 * crea la tabla con RLS desactivado por defecto). Supabase avisa por mail
 * cuando detecta tablas sin RLS.
 *
 *   pnpm db:setup-rls
 *
 * Conecta vía DATABASE_DIRECT_URL (la session pooler, no la transactional).
 * Si solo tienes DATABASE_URL la usa también, pero las migraciones / cambios
 * de schema funcionan mejor por la directa.
 */
const url =
  process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL ?? "";
if (!url) {
  console.error("Falta DATABASE_DIRECT_URL (o DATABASE_URL) en el entorno.");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

async function main() {
  const sqlPath = resolve(process.cwd(), "supabase", "setup.sql");
  const content = readFileSync(sqlPath, "utf8");
  console.log(`Ejecutando ${sqlPath} (${content.length} chars)…`);
  await sql.unsafe(content);
  console.log("✓ RLS y policies aplicadas.");
}

main()
  .then(() => sql.end({ timeout: 5 }).then(() => process.exit(0)))
  .catch((err) => {
    console.error(err);
    sql.end({ timeout: 5 }).finally(() => process.exit(1));
  });
