import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

/**
 * Carga una primera versión de plantillas (≈25-30 jugadores por selección)
 * desde la API pública de SofaScore. Idempotente por selección: salta las
 * que ya tengan jugadores salvo que se pase `--force`.
 *
 * Modo de uso:
 *   pnpm db:seed-squads                 # todas las selecciones, sin tocar las que ya tienen plantilla
 *   pnpm db:seed-squads -- --force      # borra y recarga todas
 *   pnpm db:seed-squads -- --team ESP   # sólo una selección
 *   pnpm db:seed-squads -- --no-photos  # salta la subida de fotos
 *
 * Notas:
 *  - El admin puede editar / añadir / borrar jugadores después desde
 *    /admin/jugadores. Esto sólo es bootstrap.
 *  - SofaScore ofrece la plantilla "senior" actual, no la lista de 26 del
 *    Mundial (FIFA aún no la ha publicado). Cuando se conozcan las
 *    convocatorias finales, hay que pasar a editar manualmente.
 *  - La API de SofaScore puede estar protegida por Cloudflare. Si el
 *    fetch devuelve 403 reiteradamente, hay que ejecutar el script desde
 *    una IP sin reglas anti-bot o pasar a entrada manual desde el admin.
 */

const TEAM_QUERIES: Record<string, string> = {
  // Group A
  MEX: "Mexico",
  KOR: "South Korea",
  RSA: "South Africa",
  CZE: "Czechia",
  // Group B
  CAN: "Canada",
  SUI: "Switzerland",
  QAT: "Qatar",
  BIH: "Bosnia and Herzegovina",
  // Group C
  BRA: "Brazil",
  MAR: "Morocco",
  SCO: "Scotland",
  HAI: "Haiti",
  // Group D
  USA: "USA",
  PAR: "Paraguay",
  AUS: "Australia",
  TUR: "Turkey",
  // Group E
  GER: "Germany",
  ECU: "Ecuador",
  CIV: "Ivory Coast",
  CUW: "Curaçao",
  // Group F
  NED: "Netherlands",
  JPN: "Japan",
  TUN: "Tunisia",
  SWE: "Sweden",
  // Group G
  BEL: "Belgium",
  IRN: "Iran",
  EGY: "Egypt",
  NZL: "New Zealand",
  // Group H
  ESP: "Spain",
  URU: "Uruguay",
  KSA: "Saudi Arabia",
  CPV: "Cape Verde",
  // Group I
  FRA: "France",
  SEN: "Senegal",
  NOR: "Norway",
  IRQ: "Iraq",
  // Group J
  ARG: "Argentina",
  ALG: "Algeria",
  AUT: "Austria",
  JOR: "Jordan",
  // Group K
  POR: "Portugal",
  COL: "Colombia",
  UZB: "Uzbekistan",
  COD: "DR Congo",
  // Group L
  ENG: "England",
  CRO: "Croatia",
  GHA: "Ghana",
  PAN: "Panama",
};

const POSITION_LABEL: Record<string, string> = {
  G: "POR",
  D: "DEF",
  M: "MED",
  F: "DEL",
};

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0 Safari/537.36",
  Accept: "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  Referer: "https://www.sofascore.com/",
  Origin: "https://www.sofascore.com",
};

const DELAY_MS = 350;
const BASE = "https://api.sofascore.com/api/v1";

type SofaTeam = {
  id: number;
  name: string;
  national?: boolean;
  userCount?: number;
};
type SofaPlayer = {
  id: number;
  name: string;
  shortName?: string;
  position?: string;
  jerseyNumber?: number;
  shirtNumber?: number;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      if (r.status === 403) {
        throw new Error(
          "SofaScore devolvió 403. Probable bloqueo Cloudflare; reintenta desde otra IP o entra los jugadores manualmente.",
        );
      }
      return null;
    }
    return (await r.json()) as T;
  } catch (err) {
    if (err instanceof Error && err.message.includes("403")) throw err;
    return null;
  }
}

async function searchTeam(query: string): Promise<SofaTeam | null> {
  const url = `${BASE}/search/all?q=${encodeURIComponent(query)}&page=0`;
  type SearchResp = { results?: { type: string; entity: SofaTeam }[] };
  const data = await fetchJson<SearchResp>(url);
  if (!data) return null;
  const candidates = (data.results ?? [])
    .filter((it) => it.type === "team" && it.entity?.national)
    .map((it) => it.entity);
  if (candidates.length === 0) return null;
  const lower = query.toLowerCase();
  const exact = candidates.find((t) => t.name.toLowerCase() === lower);
  if (exact) return exact;
  return candidates.sort((a, b) => (b.userCount ?? 0) - (a.userCount ?? 0))[0];
}

async function fetchSquad(teamId: number): Promise<SofaPlayer[]> {
  type Resp = { players?: { player: SofaPlayer }[] };
  const data = await fetchJson<Resp>(`${BASE}/team/${teamId}/players`);
  if (!data) return [];
  return (data.players ?? []).map((p) => p.player);
}

async function uploadPhoto(sofaPlayerId: number): Promise<string | null> {
  const url = `${BASE}/player/${sofaPlayerId}/image`;
  try {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) return null;
    const buffer = Buffer.from(await r.arrayBuffer());
    if (buffer.byteLength < 200) return null; // SofaScore returns a tiny placeholder when missing
    const supabase = createSupabaseServiceClient();
    const path = `sofa-${sofaPlayerId}.png`;
    const { error } = await supabase.storage.from("players").upload(path, buffer, {
      contentType: "image/png",
      upsert: true,
    });
    if (error) {
      console.warn(`    ⚠ subida foto: ${error.message}`);
      return null;
    }
    const {
      data: { publicUrl },
    } = supabase.storage.from("players").getPublicUrl(path);
    return publicUrl;
  } catch {
    return null;
  }
}

type Opts = { force: boolean; uploadPhotos: boolean };

async function seedTeam(
  team: { id: number; code: string; name: string },
  opts: Opts,
) {
  const existing = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.teamId, team.id));
  if (existing.length > 0 && !opts.force) {
    console.log(`  · ${team.code} ${team.name} — ya tiene ${existing.length} jugadores, skip`);
    return;
  }

  const query = TEAM_QUERIES[team.code] ?? team.name;
  process.stdout.write(`  · ${team.code} ${team.name} — buscando "${query}"… `);
  const sofaTeam = await searchTeam(query);
  if (!sofaTeam) {
    console.log("✗ no encontrada en SofaScore");
    return;
  }
  console.log(`SofaScore #${sofaTeam.id} ${sofaTeam.name}`);

  await sleep(DELAY_MS);
  const squad = await fetchSquad(sofaTeam.id);
  if (squad.length === 0) {
    console.log(`    ⚠ plantilla vacía`);
    return;
  }

  if (opts.force) {
    await db.delete(players).where(eq(players.teamId, team.id));
  }

  let okCount = 0;
  for (const p of squad) {
    const positionLabel = p.position ? POSITION_LABEL[p.position] ?? p.position : null;
    const number = p.jerseyNumber ?? p.shirtNumber ?? null;
    let photoUrl: string | null = null;
    if (opts.uploadPhotos) {
      photoUrl = await uploadPhoto(p.id);
      await sleep(120);
    }
    await db.insert(players).values({
      teamId: team.id,
      name: p.name,
      position: positionLabel,
      jerseyNumber: number,
      photoUrl,
    });
    okCount += 1;
  }
  console.log(`    ✓ ${okCount} jugadores cargados`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const uploadPhotos = !args.includes("--no-photos");
  const teamFlagIdx = args.indexOf("--team");
  const targetCode = teamFlagIdx >= 0 ? args[teamFlagIdx + 1]?.toUpperCase() : null;

  console.log(
    `→ Cargando plantillas desde SofaScore${force ? " (force)" : ""}${
      uploadPhotos ? " + fotos" : ""
    }…`,
  );

  const allTeams = await db.select().from(teams);
  const targets = targetCode
    ? allTeams.filter((t) => t.code.toUpperCase() === targetCode)
    : allTeams;

  if (targets.length === 0) {
    console.error(
      targetCode
        ? `× No existe la selección con code=${targetCode}.`
        : "× No hay selecciones cargadas. Ejecuta `pnpm db:seed-tournament` primero.",
    );
    process.exit(1);
  }

  let processed = 0;
  for (const team of targets) {
    try {
      await seedTeam(team, { force, uploadPhotos });
    } catch (err) {
      if (err instanceof Error && err.message.includes("403")) {
        console.error(`\n× ${err.message}`);
        process.exit(1);
      }
      console.warn(`  ⚠ ${team.code} falló: ${err}`);
    }
    processed += 1;
    if (processed < targets.length) await sleep(DELAY_MS);
  }

  console.log(`✓ ${processed} selecciones procesadas.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
