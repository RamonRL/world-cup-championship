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

/** Fuentes de marca para `ImageResponse({ fonts })`. */
export async function ogFonts(): Promise<SatoriFont[]> {
  if (fontCache) return fontCache;
  const [bigShoulders, dmSans] = await Promise.all([
    readPublic("fonts/BigShouldersDisplay.ttf"),
    readPublic("fonts/DMSans.ttf"),
  ]);
  fontCache = [
    // BigShouldersDisplay — la usa el `font-display` de la web. Variable
    // axis "wght" cubre 100-900; registramos los 3 weights que usamos.
    { name: "BigShoulders", data: bigShoulders, weight: 700, style: "normal" },
    { name: "BigShoulders", data: bigShoulders, weight: 900, style: "normal" },
    // DMSans — la usa el `font-sans`. La utilizamos para texto de apoyo
    // (eyebrows, strip inferior).
    { name: "DMSans", data: dmSans, weight: 400, style: "normal" },
    { name: "DMSans", data: dmSans, weight: 700, style: "normal" },
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
 * Fondo "brand" reutilizable: gradient base + textura halftone (SVG
 * inline base64) muy sutil — replica la sensación editorial de la web.
 * Devuelve los `style.background` y un `<div aria-hidden>` opcional con
 * la textura encima si se renderiza dentro del componente.
 */
export const OG_BG = {
  background: `linear-gradient(135deg, ${OG_COLORS.bg} 0%, #2a1f15 60%, #3d2914 100%)`,
} as const;
