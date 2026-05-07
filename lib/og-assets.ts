/**
 * Helpers compartidos por todos los `opengraph-image.tsx`. Lee fuentes y
 * logos del repo (no de internet) → Satori los usa sin depender de la
 * red. Cacheado en memoria del proceso para que solo cueste el primer
 * render.
 *
 * Las fuentes son TTF variables; las registramos varias veces con
 * weights distintos para que Satori pueda elegir el adecuado al estilo
 * del texto.
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function readPublic(path: string): Promise<Buffer> {
  return readFile(join(process.cwd(), "public", path));
}

let fontCache: SatoriFont[] | null = null;
let assetCache: Assets | null = null;

type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 700 | 900;
  style: "normal";
};

type Assets = {
  fwc26DataUrl: string;
  qmMarkDataUrl: string;
};

/**
 * Fuentes de marca para `ImageResponse({ fonts })`. Usamos TTFs ESTÁTICAS
 * (no variables): Satori revienta con
 *   `Cannot read properties of undefined (reading '256')`
 * al intentar leer la tabla OS/2 de un TTF variable. Las descargamos del
 * CDN de Google (ver `scripts/og-fonts-fetch` o el README) y las
 * bundlemos en `public/fonts/`.
 */
export async function ogFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  const [bsBold, bsBlack, dmRegular, dmBold] = await Promise.all([
    readPublic("fonts/BigShouldersDisplay-Bold.ttf"),
    readPublic("fonts/BigShouldersDisplay-Black.ttf"),
    readPublic("fonts/DMSans-Regular.ttf"),
    readPublic("fonts/DMSans-Bold.ttf"),
  ]);
  fontCache = [
    { name: "BigShoulders", data: bsBold, weight: 700, style: "normal" },
    { name: "BigShoulders", data: bsBlack, weight: 900, style: "normal" },
    { name: "DMSans", data: dmRegular, weight: 400, style: "normal" },
    { name: "DMSans", data: dmBold, weight: 700, style: "normal" },
  ];
  return fontCache;
}

/** Logos de marca como data URL — Satori los embebe sin llamada de red. */
export async function ogAssets(): Promise<Assets> {
  if (assetCache) return assetCache;
  const [fwc26, qm] = await Promise.all([
    readPublic("fwc26.png"),
    readPublic("qm-mark.png"),
  ]);
  assetCache = {
    fwc26DataUrl: `data:image/png;base64,${fwc26.toString("base64")}`,
    qmMarkDataUrl: `data:image/png;base64,${qm.toString("base64")}`,
  };
  return assetCache;
}

/**
 * Paleta de marca, mismos hex que las CSS vars del site:
 *   --color-arena       → #d97742
 *   --color-bg          → #0e1014
 *   --color-surface     → #1a1d24
 *   --color-surface-2   → #22252e
 *   --color-foreground  → #f5efe6
 *   --color-muted-fg    → rgba(245,239,230,0.65)
 */
export const OG_COLORS = {
  arena: "#d97742",
  arenaDeep: "#a85423",
  bg: "#0e1014",
  surface: "#1a1d24",
  surface2: "#22252e",
  foreground: "#f5efe6",
  muted: "rgba(245, 239, 230, 0.6)",
  mutedStrong: "rgba(245, 239, 230, 0.85)",
} as const;

/**
 * Fondo "brand" reutilizable. Casi negro (mismo `--color-bg` de la web,
 * #0e1014) con un toque sutil de profundidad. Antes era un gradient
 * marrón que se veía gris/naranja en miniatura — ahora es solid dark
 * casi negro, igual que el site.
 */
export const OG_BG = {
  background: OG_COLORS.bg,
} as const;
