import { isNotNull } from "drizzle-orm";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { players } from "@/lib/db/schema";

/**
 * Borra todas las fotos de jugadores: vacía el bucket `players` en Supabase
 * Storage y pone `players.photo_url` a NULL. NO toca la tabla `players` ni
 * relaciones — solo las imágenes.
 *
 * Uso:
 *   pnpm db:wipe-player-photos             # ejecuta
 *   pnpm db:wipe-player-photos --dry-run   # logs, sin tocar nada
 */

const BUCKET = "players";
const dryRun = process.argv.includes("--dry-run");

async function listAllKeys(): Promise<string[]> {
  const supabase = createSupabaseServiceClient();
  const keys: string[] = [];

  // El bucket está organizado por carpeta de selección (`MEX/...`, `ESP/...`).
  // Listamos la raíz para sacar las carpetas, luego cada carpeta.
  const { data: rootEntries, error: rootErr } = await supabase.storage
    .from(BUCKET)
    .list("", { limit: 1000 });
  if (rootErr) throw new Error(`list root: ${rootErr.message}`);

  for (const entry of rootEntries ?? []) {
    if (entry.id === null) {
      // Carpeta. `list(prefix)` lista lo de dentro.
      const { data: children, error: childErr } = await supabase.storage
        .from(BUCKET)
        .list(entry.name, { limit: 1000 });
      if (childErr) throw new Error(`list ${entry.name}: ${childErr.message}`);
      for (const f of children ?? []) {
        if (f.id !== null) keys.push(`${entry.name}/${f.name}`);
      }
    } else {
      keys.push(entry.name);
    }
  }

  return keys;
}

async function main() {
  const supabase = createSupabaseServiceClient();

  const keys = await listAllKeys();
  console.log(`Storage: ${keys.length} archivos en bucket "${BUCKET}".`);

  if (keys.length > 0) {
    if (dryRun) {
      console.log("--dry-run: no borro storage.");
      keys.slice(0, 10).forEach((k) => console.log(`  · ${k}`));
      if (keys.length > 10) console.log(`  · … (+${keys.length - 10})`);
    } else {
      const { error } = await supabase.storage.from(BUCKET).remove(keys);
      if (error) throw new Error(`remove: ${error.message}`);
      console.log(`Storage: ${keys.length} archivos borrados.`);
    }
  }

  if (dryRun) {
    const rows = await db
      .select({ id: players.id })
      .from(players)
      .where(isNotNull(players.photoUrl));
    console.log(`DB: ${rows.length} jugadores con photoUrl no nulo (no actualizo).`);
  } else {
    const updated = await db
      .update(players)
      .set({ photoUrl: null })
      .where(isNotNull(players.photoUrl))
      .returning({ id: players.id });
    console.log(`DB: ${updated.length} jugadores actualizados (photoUrl → NULL).`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
