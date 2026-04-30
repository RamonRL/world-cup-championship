import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, teams } from "@/lib/db/schema";

/**
 * Carga una primera versión de plantillas (~26 jugadores por selección)
 * desde Wikipedia. Idempotente por selección: salta las que ya tengan
 * jugadores salvo que se pase `--force`.
 *
 * Modo de uso:
 *   pnpm db:seed-squads                 # todas, sin tocar las que ya tienen plantilla
 *   pnpm db:seed-squads -- --force      # borra y recarga todas
 *   pnpm db:seed-squads -- --team ESP   # sólo una selección
 *
 * Por qué Wikipedia y no SofaScore: SofaScore vive detrás de Cloudflare
 * y devuelve 403 a fetches sin sesión navegador. Wikipedia ofrece la
 * misma información en un endpoint público (`action=parse&prop=wikitext`)
 * sin auth ni rate-limit estricto, y mantiene los squads actualizados
 * por colaboradores.
 *
 * Limitaciones:
 *  - Sin foto de jugador (Wikipedia no las tiene en la fila del squad).
 *  - El parser asume que la sección "Current squad" usa la template
 *    `{{nat fs g/r player|...}}`, que es la convención mayoritaria. Si
 *    una selección no la usa, sale 0 jugadores y hay que cargarla a mano
 *    desde /admin/jugadores.
 *  - Lo que devuelve es la última convocatoria, NO la lista de 26 del
 *    Mundial (FIFA aún no la ha anunciado). Cuando se confirmen las
 *    convocatorias finales (~mayo 2026), hay que ajustar manualmente.
 */

const TEAM_WIKI_SLUGS: Record<string, string> = {
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

const POSITION_MAP: Record<string, string> = {
  GK: "POR",
  DF: "DEF",
  MF: "MED",
  FW: "DEL",
  Goalkeeper: "POR",
  Defender: "DEF",
  Midfielder: "MED",
  Forward: "DEL",
};

const HEADERS: Record<string, string> = {
  "User-Agent":
    "WorldCupChampionshipSeed/1.0 (https://github.com/RamonRL/world-cup-championship; contact: ramon.romero@unnax.com) tsx/node",
  Accept: "application/json",
};

const DELAY_MS = 800;
const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWikitext(slug: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=parse&page=${encodeURIComponent(
    slug,
  )}&prop=wikitext&format=json&formatversion=2&redirects=1`;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const r = await fetch(url, { headers: HEADERS });
    if (r.status === 429) {
      // Honor Retry-After if present, else exponential backoff.
      const retryAfter = Number(r.headers.get("retry-after") ?? "0");
      const wait = retryAfter > 0 ? retryAfter * 1000 : 1500 * (attempt + 1);
      await sleep(wait);
      continue;
    }
    if (!r.ok) return null;
    const data = (await r.json()) as {
      parse?: { wikitext?: string };
      error?: { code: string };
    };
    if (data.error) return null;
    return data.parse?.wikitext ?? null;
  }
  return null;
}

function findCurrentSquadSection(wikitext: string): string | null {
  // Match `==Current squad==` (any header level). Allow trailing comments /
  // wikicomments / whitespace on the same line, e.g.
  //   ===Current squad===<!--PLEASE UPDATE…-->
  const headerRe = /^(={2,})\s*Current\s+squad\s*\1[^\n]*$/im;
  const match = wikitext.match(headerRe);
  if (!match || match.index == null) return null;
  const start = match.index + match[0].length;
  const level = match[1].length;
  // Stop at any header with the same level or shallower (fewer `=`).
  const stopperRe = new RegExp(
    `^={1,${level}}[^=][^\\n]*?={1,${level}}[^\\n]*$`,
    "m",
  );
  const after = wikitext.slice(start);
  const nextMatch = after.match(stopperRe);
  return nextMatch != null && nextMatch.index != null
    ? after.slice(0, nextMatch.index)
    : after;
}

function splitTemplateParams(content: string): string[] {
  const parts: string[] = [];
  let buf = "";
  let depth = 0;
  for (let i = 0; i < content.length; i++) {
    const c = content[i];
    const next = content[i + 1] ?? "";
    if ((c === "{" && next === "{") || (c === "[" && next === "[")) {
      depth++;
      buf += c;
      continue;
    }
    if ((c === "}" && next === "}") || (c === "]" && next === "]")) {
      depth = Math.max(0, depth - 1);
      buf += c;
      continue;
    }
    if (c === "|" && depth === 0) {
      parts.push(buf);
      buf = "";
      continue;
    }
    buf += c;
  }
  parts.push(buf);
  return parts;
}

function parseParams(content: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const part of splitTemplateParams(content)) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    out[part.slice(0, idx).trim()] = part.slice(idx + 1).trim();
  }
  return out;
}

function cleanWikiText(text: string): string {
  return text
    // {{sortname|First|Last|...}} → "First Last"  (positional first two args).
    .replace(
      /\{\{\s*sortname\s*\|([^|}]+)\|([^|}]+)(?:\|[^}]*)?\}\}/gi,
      (_full, first: string, last: string) => `${first.trim()} ${last.trim()}`,
    )
    // [[link|display]] → display, [[link]] → link
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    // Bold / italic markup
    .replace(/'''([^']+)'''/g, "$1")
    .replace(/''([^']+)''/g, "$1")
    // Drop any other templates and HTML
    .replace(/\{\{[^}]+\}\}/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

type RawPlayer = {
  name: string;
  position: string | null;
  jerseyNumber: number | null;
};

function* iterateTemplates(text: string): Generator<{ name: string; body: string }> {
  let i = 0;
  while (i < text.length) {
    if (text[i] !== "{" || text[i + 1] !== "{") {
      i++;
      continue;
    }
    let depth = 1;
    let j = i + 2;
    while (j < text.length && depth > 0) {
      if (text[j] === "{" && text[j + 1] === "{") {
        depth++;
        j += 2;
      } else if (text[j] === "}" && text[j + 1] === "}") {
        depth--;
        j += 2;
      } else {
        j++;
      }
    }
    if (depth !== 0) {
      i = j;
      continue;
    }
    const inner = text.slice(i + 2, j - 2);
    const pipeIdx = inner.indexOf("|");
    const name = (pipeIdx === -1 ? inner : inner.slice(0, pipeIdx)).trim();
    const body = pipeIdx === -1 ? "" : inner.slice(pipeIdx + 1);
    yield { name, body };
    i = j;
  }
}

const PLAYER_TEMPLATE_RE = /^nat\s+fs\s+[grc]\s+player$/i;

function parsePlayers(squadSection: string): RawPlayer[] {
  const players: RawPlayer[] = [];
  const seen = new Set<string>();
  for (const tpl of iterateTemplates(squadSection)) {
    if (!PLAYER_TEMPLATE_RE.test(tpl.name)) continue;
    const params = parseParams(tpl.body);
    const rawName = params.name ?? params.Name ?? "";
    const name = cleanWikiText(rawName);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const pos = params.pos ?? params.position ?? null;
    const positionLabel = pos ? POSITION_MAP[pos.toUpperCase()] ?? pos : null;
    const noStr = (params.no ?? params.number ?? "").trim();
    const parsedNo = noStr ? parseInt(noStr, 10) : NaN;
    players.push({
      name,
      position: positionLabel,
      jerseyNumber: Number.isFinite(parsedNo) ? parsedNo : null,
    });
  }
  return players;
}

type Opts = { force: boolean };

async function seedTeam(
  team: { id: number; code: string; name: string },
  opts: Opts,
) {
  const slug = TEAM_WIKI_SLUGS[team.code];
  if (!slug) {
    console.log(`  · ${team.code} ${team.name} — sin slug Wikipedia, skip`);
    return;
  }

  const existing = await db
    .select({ id: players.id })
    .from(players)
    .where(eq(players.teamId, team.id));
  if (existing.length > 0 && !opts.force) {
    console.log(
      `  · ${team.code} ${team.name} — ya tiene ${existing.length} jugadores, skip`,
    );
    return;
  }

  process.stdout.write(`  · ${team.code} ${team.name} — ${slug}… `);
  const wikitext = await fetchWikitext(slug);
  if (!wikitext) {
    console.log("✗ artículo no encontrado");
    return;
  }
  const section = findCurrentSquadSection(wikitext);
  if (!section) {
    console.log("✗ sin sección 'Current squad'");
    return;
  }
  const squad = parsePlayers(section);
  if (squad.length === 0) {
    console.log("✗ 0 jugadores parseados (template no estándar)");
    return;
  }

  if (opts.force) {
    await db.delete(players).where(eq(players.teamId, team.id));
  }

  for (const p of squad) {
    await db.insert(players).values({
      teamId: team.id,
      name: p.name,
      position: p.position,
      jerseyNumber: p.jerseyNumber,
      photoUrl: null,
    });
  }

  console.log(`✓ ${squad.length} jugadores`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const teamFlagIdx = args.indexOf("--team");
  const targetCode = teamFlagIdx >= 0 ? args[teamFlagIdx + 1]?.toUpperCase() : null;

  console.log(`→ Cargando plantillas desde Wikipedia${force ? " (force)" : ""}…`);

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
      await seedTeam(team, { force });
    } catch (err) {
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
