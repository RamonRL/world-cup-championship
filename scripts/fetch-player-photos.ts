import { eq, isNull } from "drizzle-orm";
import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";

/**
 * Fetcher de fotos de jugadores desde Wikidata + Wikimedia Commons.
 *
 * Estrategia: por cada selección, una sola query SPARQL devuelve TODOS los
 * jugadores con imagen registrada. Después matcheamos por nombre normalizado
 * contra la tabla `players` y descargamos las que tienen pareja. Con esto
 * pasamos de ~5 requests/jugador a 1 request/equipo + 1 descarga por foto
 * encontrada — así el script entero termina en un par de minutos para los
 * 48 equipos.
 *
 * Modo de uso:
 *   pnpm tsx scripts/fetch-player-photos.ts                # todos los equipos, solo huecos
 *   pnpm tsx scripts/fetch-player-photos.ts --team ESP     # solo España
 *   pnpm tsx scripts/fetch-player-photos.ts --force        # re-fetch aunque photoUrl ya esté
 *   pnpm tsx scripts/fetch-player-photos.ts --dry-run      # logs, sin tocar nada
 *
 * Limitaciones conocidas:
 *  - Cobertura de Wikidata: ~70-85% en selecciones top, baja a ~50% en menores
 *    (Cabo Verde, Curazao, Uzbekistán). Los huecos hay que cubrirlos por
 *    otro canal (API-Football u oficial de la federación).
 *  - El matching por nombre es best-effort. Si el seed-squads cargó un nombre
 *    distinto del que tiene Wikipedia ("Vini Jr." vs "Vinícius Júnior"),
 *    el script no encuentra match. Solución: editar el row en /admin/jugadores
 *    o normalizar el seed.
 *  - P18 en Wikidata suele ser una foto reciente, no necesariamente con la
 *    elástica nacional. Algunas son de archivo (de hace años).
 */

const TEAM_WIKIPEDIA_TITLES: Record<string, string> = {
  // Group A
  MEX: "Mexico national football team",
  KOR: "South Korea national football team",
  RSA: "South Africa national football team",
  CZE: "Czech Republic national football team",
  // Group B
  CAN: "Canada men's national soccer team",
  SUI: "Switzerland national football team",
  QAT: "Qatar national football team",
  BIH: "Bosnia and Herzegovina national football team",
  // Group C
  BRA: "Brazil national football team",
  MAR: "Morocco national football team",
  SCO: "Scotland national football team",
  HAI: "Haiti national football team",
  // Group D
  USA: "United States men's national soccer team",
  PAR: "Paraguay national football team",
  AUS: "Australia men's national soccer team",
  TUR: "Turkey national football team",
  // Group E
  GER: "Germany national football team",
  ECU: "Ecuador national football team",
  CIV: "Ivory Coast national football team",
  CUW: "Curaçao national football team",
  // Group F
  NED: "Netherlands national football team",
  JPN: "Japan national football team",
  TUN: "Tunisia national football team",
  SWE: "Sweden men's national football team",
  // Group G
  BEL: "Belgium national football team",
  IRN: "Iran national football team",
  EGY: "Egypt national football team",
  NZL: "New Zealand men's national football team",
  // Group H
  ESP: "Spain national football team",
  URU: "Uruguay national football team",
  KSA: "Saudi Arabia national football team",
  CPV: "Cape Verde national football team",
  // Group I
  FRA: "France national football team",
  SEN: "Senegal national football team",
  NOR: "Norway national football team",
  IRQ: "Iraq national football team",
  // Group J
  ARG: "Argentina national football team",
  ALG: "Algeria national football team",
  AUT: "Austria national football team",
  JOR: "Jordan national football team",
  // Group K
  POR: "Portugal national football team",
  COL: "Colombia national football team",
  UZB: "Uzbekistan national football team",
  COD: "DR Congo national football team",
  // Group L
  ENG: "England national football team",
  CRO: "Croatia national football team",
  GHA: "Ghana national football team",
  PAN: "Panama national football team",
};

const USER_AGENT =
  "WorldCupChampionshipPhotos/1.0 (https://quinielamundial.es; admin@quinielamundial.es)";

const COMMONS_THUMB_WIDTH = 400;
const SUPABASE_BUCKET = "players";

// Wikidata pide ~1 req/s al endpoint público; con UA identificable y queries
// bien indexadas se permite más, pero tampoco hay prisa.
const SLEEP_BETWEEN_REQUESTS_MS = 200;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeName(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip accents
    .replace(/[^a-z0-9\s]/gi, " ") // strip punctuation
    .replace(/\s+/g, " ")
    .toLowerCase()
    .trim();
}

type Args = {
  team?: string;
  force: boolean;
  dryRun: boolean;
  limit?: number;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { force: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--force") args.force = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--team" || a === "-t") args.team = argv[++i]?.toUpperCase();
    else if (a.startsWith("--team=")) args.team = a.split("=")[1].toUpperCase();
    else if (a === "--limit") args.limit = Number(argv[++i]);
    else if (a.startsWith("--limit=")) args.limit = Number(a.split("=")[1]);
  }
  return args;
}

// ────────────────── Wikipedia → Wikidata ──────────────────

async function getTeamWdId(wikiTitle: string): Promise<string | null> {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("prop", "pageprops");
  url.searchParams.set("titles", wikiTitle);
  url.searchParams.set("redirects", "1");
  url.searchParams.set("format", "json");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Wikipedia query failed for "${wikiTitle}": ${res.status}`);
  }
  const data = (await res.json()) as {
    query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
  };
  const pages = data.query?.pages;
  if (!pages) return null;
  const first = Object.values(pages)[0];
  return first?.pageprops?.wikibase_item ?? null;
}

// ────────────────── Wikidata SPARQL ──────────────────

type WdPlayer = { qid: string; names: Set<string>; commonsFile: string };

async function getTeamSquadFromWikidata(teamWdId: string): Promise<WdPlayer[]> {
  // P54 = "member of sports team". Usamos la sintaxis reificada
  // `p:P54/ps:P54` (todas las statements) en lugar del shortcut `wdt:P54`
  // (solo rank=preferred). El shortcut excluye al jugador de su selección
  // cuando tiene su CLUB marcado como preferred (caso típico: Pedri,
  // Lamine Yamal, etc.), porque Wikidata interpreta que la "verdad principal"
  // de su pertenencia a un equipo es el club, no la selección.
  // P18 = "image". Recogemos labels en EN+ES + altLabels (apodos cortos
  // tipo "Pedri", "Rodri") porque el Label preferido suele ser el nombre
  // completo y no matchea contra el seed.
  const sparql = `
    SELECT ?player ?label ?altLabel ?image WHERE {
      ?player p:P54/ps:P54 wd:${teamWdId} ;
              wdt:P18 ?image .
      OPTIONAL {
        ?player rdfs:label ?label .
        FILTER(LANG(?label) IN ("en", "es"))
      }
      OPTIONAL {
        ?player skos:altLabel ?altLabel .
        FILTER(LANG(?altLabel) IN ("en", "es"))
      }
    }
  `.trim();

  const url = new URL("https://query.wikidata.org/sparql");
  url.searchParams.set("query", sparql);
  url.searchParams.set("format", "json");

  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/sparql-results+json" },
  });
  if (!res.ok) {
    throw new Error(`SPARQL query failed (${teamWdId}): ${res.status}`);
  }
  const data = (await res.json()) as {
    results: {
      bindings: Array<{
        player: { value: string };
        label?: { value: string };
        altLabel?: { value: string };
        image: { value: string };
      }>;
    };
  };

  // Agrupamos rows por jugador (multiplicidad por aliases) en una única
  // entrada con set de nombres.
  const byQid = new Map<string, WdPlayer>();
  for (const row of data.results.bindings) {
    const qid = row.player.value.split("/").pop() ?? "";
    if (!qid) continue;
    let entry = byQid.get(qid);
    if (!entry) {
      const file = decodeURIComponent(row.image.value.split("/").pop() ?? "");
      entry = { qid, names: new Set(), commonsFile: file };
      byQid.set(qid, entry);
    }
    if (row.label?.value) entry.names.add(row.label.value);
    if (row.altLabel?.value) entry.names.add(row.altLabel.value);
  }
  return Array.from(byQid.values());
}

/**
 * Matching tolerante por exact / prefix bidireccional sobre label + aliases.
 * Casos cubiertos:
 *  - exact: DB "Unai Simón" === alias "Unai Simón".
 *  - DB es prefijo del candidato: DB "Lamine Yamal" prefijo de "Lamine Yamal
 *    Nasraoui Ebana" (label oficial completo en WD).
 *  - candidato es prefijo del DB: DB "Ander Barrenetxea" empieza por alias
 *    "Ander" (raro pero posible).
 *
 * Descartamos la regla "todos los tokens del DB en cualquier orden": producía
 * falsos positivos con dos jugadores que comparten un token frecuente
 * (Borja Iglesias ↔ Borja Valero, Víctor Muñoz ↔ Víctor Manuel Fernández).
 */
function matchesPlayer(dbName: string, candidate: WdPlayer): boolean {
  const dbN = normalizeName(dbName);
  if (!dbN) return false;
  for (const name of candidate.names) {
    const n = normalizeName(name);
    if (!n) continue;
    if (n === dbN) return true;
    if (n.startsWith(dbN + " ")) return true;
    if (dbN.startsWith(n + " ")) return true;
  }
  return false;
}

function findCandidate(dbName: string, candidates: WdPlayer[]): WdPlayer | null {
  for (const c of candidates) {
    if (matchesPlayer(dbName, c)) return c;
  }
  return null;
}

// ────────────────── Imagen download ──────────────────

async function downloadCommonsImage(
  commonsFile: string,
  width: number,
): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  const url = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(
    commonsFile,
  )}?width=${width}`;
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) {
    throw new Error(`Image download failed: ${commonsFile} (${res.status})`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  // Extension from content type — Wikimedia normalmente devuelve jpeg
  // por el thumbnailer aunque el original fuera png/svg.
  const ext = contentType.includes("png")
    ? "png"
    : contentType.includes("webp")
      ? "webp"
      : "jpg";
  return { buffer, contentType, ext };
}

// ────────────────── Supabase upload ──────────────────

async function uploadPhoto(
  buffer: Buffer,
  path: string,
  contentType: string,
): Promise<string> {
  const supabase = createSupabaseServiceClient();
  const { error } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(path, buffer, { contentType, upsert: true });
  if (error) throw new Error(`Supabase upload failed (${path}): ${error.message}`);
  const {
    data: { publicUrl },
  } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(path);
  return publicUrl;
}

// ────────────────── Main per-team loop ──────────────────

type Stats = {
  team: string;
  dbPlayers: number;
  wdHits: number;
  matched: number;
  uploaded: number;
  failed: number;
  skipped: number;
  unmatched: string[];
};

async function processTeam(teamCode: string, args: Args): Promise<Stats> {
  const stats: Stats = {
    team: teamCode,
    dbPlayers: 0,
    wdHits: 0,
    matched: 0,
    uploaded: 0,
    failed: 0,
    skipped: 0,
    unmatched: [],
  };

  const wikiTitle = TEAM_WIKIPEDIA_TITLES[teamCode];
  if (!wikiTitle) {
    console.error(`  ✗ ${teamCode}: sin entrada en TEAM_WIKIPEDIA_TITLES`);
    return stats;
  }

  // 1) DB players
  const [team] = await db.select().from(teams).where(eq(teams.code, teamCode)).limit(1);
  if (!team) {
    console.error(`  ✗ ${teamCode}: equipo no encontrado en DB`);
    return stats;
  }

  const dbPlayers = await db
    .select()
    .from(players)
    .where(args.force ? eq(players.teamId, team.id) : eq(players.teamId, team.id));
  // Filtrado a TS-side por args.force (drizzle no admite condicional limpia
  // sobre IS NULL combinada con eq) — el coste de filtrar 26 filas es 0.
  const targets = args.force
    ? dbPlayers
    : dbPlayers.filter((p) => p.photoUrl == null);
  stats.dbPlayers = dbPlayers.length;
  stats.skipped = dbPlayers.length - targets.length;

  if (targets.length === 0) {
    console.log(`  · ${teamCode}: 0 jugadores pendientes (skip)`);
    return stats;
  }

  // 2) Wikidata team Q-ID + squad
  const teamWdId = await getTeamWdId(wikiTitle);
  if (!teamWdId) {
    console.error(`  ✗ ${teamCode}: no se pudo resolver wikibase_item de "${wikiTitle}"`);
    return stats;
  }
  await sleep(SLEEP_BETWEEN_REQUESTS_MS);

  const wdSquad = await getTeamSquadFromWikidata(teamWdId);
  stats.wdHits = wdSquad.length;
  await sleep(SLEEP_BETWEEN_REQUESTS_MS);

  // 3) Match + descarga + upload. Tolerante (label/alias/prefijo/tokens).
  for (const player of targets) {
    const hit = findCandidate(player.name, wdSquad);
    if (!hit) {
      stats.unmatched.push(player.name);
      continue;
    }
    stats.matched++;

    if (args.dryRun) {
      console.log(`    ✓ ${player.name} ↔ ${hit.commonsFile}`);
      continue;
    }

    try {
      const { buffer, contentType, ext } = await downloadCommonsImage(
        hit.commonsFile,
        COMMONS_THUMB_WIDTH,
      );
      const path = `${teamCode}/${player.id}.${ext}`;
      const publicUrl = await uploadPhoto(buffer, path, contentType);
      await db.update(players).set({ photoUrl: publicUrl }).where(eq(players.id, player.id));
      stats.uploaded++;
      console.log(`    ✓ ${player.name} → ${path}`);
    } catch (err) {
      stats.failed++;
      console.error(`    ✗ ${player.name}: ${(err as Error).message}`);
    }

    await sleep(SLEEP_BETWEEN_REQUESTS_MS);
  }

  return stats;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const allCodes = Object.keys(TEAM_WIKIPEDIA_TITLES);
  const codes = args.team
    ? allCodes.filter((c) => c === args.team)
    : allCodes;

  if (codes.length === 0) {
    console.error(`Sin equipos para procesar (¿código '${args.team}' inválido?)`);
    process.exit(1);
  }

  console.log(
    `▸ Fetching photos | teams=${codes.length} dryRun=${args.dryRun} force=${args.force}`,
  );

  const allStats: Stats[] = [];
  for (const code of codes) {
    console.log(`▸ ${code}`);
    try {
      const stats = await processTeam(code, args);
      allStats.push(stats);
    } catch (err) {
      console.error(`  ✗ ${code}: fallo crítico — ${(err as Error).message}`);
      allStats.push({
        team: code,
        dbPlayers: 0,
        wdHits: 0,
        matched: 0,
        uploaded: 0,
        failed: 1,
        skipped: 0,
        unmatched: [],
      });
    }
  }

  // Resumen
  console.log("\n══════════════ RESUMEN ══════════════");
  console.log(
    `${"team".padEnd(5)} ${"db".padStart(3)} ${"wd".padStart(3)} ${"match".padStart(5)} ${"up".padStart(3)} ${"fail".padStart(4)} ${"skip".padStart(4)}`,
  );
  let totalMatched = 0;
  let totalUploaded = 0;
  let totalFailed = 0;
  for (const s of allStats) {
    console.log(
      `${s.team.padEnd(5)} ${s.dbPlayers.toString().padStart(3)} ${s.wdHits.toString().padStart(3)} ${s.matched.toString().padStart(5)} ${s.uploaded.toString().padStart(3)} ${s.failed.toString().padStart(4)} ${s.skipped.toString().padStart(4)}`,
    );
    totalMatched += s.matched;
    totalUploaded += s.uploaded;
    totalFailed += s.failed;
  }
  console.log(`──────────────`);
  console.log(`matched=${totalMatched} uploaded=${totalUploaded} failed=${totalFailed}`);

  // Lista de no-matcheados (para revisión manual)
  const unmatched = allStats.flatMap((s) =>
    s.unmatched.map((n) => `${s.team}: ${n}`),
  );
  if (unmatched.length > 0) {
    console.log(`\nSin match en Wikidata (${unmatched.length}):`);
    for (const u of unmatched) console.log(`  · ${u}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
