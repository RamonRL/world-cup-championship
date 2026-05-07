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
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { circleFlagUrl } from "@/lib/flags";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * Lee un archivo de `public/` con dos rutas:
 *   1. fs (vía outputFileTracingIncludes en next.config). Es lo que
 *      ocurre en dev y debería ocurrir también en serverless.
 *   2. Si falla con ENOENT (Vercel no bundleó el archivo), fetch
 *      contra el dominio deployado. Pelín más lento por cold start
 *      pero bulletproof.
 */

async function readPublic(path: string): Promise<Buffer> {
  try {
    return await readFile(join(process.cwd(), "public", path));
  } catch (err) {
    if ((err as NodeJS.ErrnoException)?.code !== "ENOENT") throw err;
    const url = `${getBaseUrl()}/${path}`;
    const res = await fetch(url, { next: { revalidate: 60 * 60 * 24 * 7 } });
    if (!res.ok) {
      throw new Error(`readPublic fetch failed for /${path}: ${res.status}`);
    }
    return Buffer.from(await res.arrayBuffer());
  }
}

const flagCache = new Map<string, string | null>();

/**
 * Trae una bandera SVG de HatScripts y la devuelve como `data:` URL.
 * Si Satori intenta resolver una URL remota se cae a veces en serverless
 * (timeouts del fetch interno, parser SVG quisquilloso). Hacer el fetch
 * nosotros y pasarle un data URL es bullet-proof.
 *
 * Cachea por code para evitar refetch en la misma cold-start.
 */
export async function flagDataUrl(
  code: string | null | undefined,
): Promise<string | null> {
  if (!code) return null;
  const key = code.toUpperCase();
  if (flagCache.has(key)) return flagCache.get(key)!;
  const url = circleFlagUrl(code);
  if (!url) {
    flagCache.set(key, null);
    return null;
  }
  try {
    const res = await fetch(url, {
      // Cache estable: la bandera no cambia.
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!res.ok) {
      flagCache.set(key, null);
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const dataUrl = `data:image/svg+xml;base64,${buf.toString("base64")}`;
    flagCache.set(key, dataUrl);
    return dataUrl;
  } catch {
    flagCache.set(key, null);
    return null;
  }
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
 * Paleta de marca para las OGs.
 *   accent     → rojo cálido (más legible en miniatura que el arena
 *                naranja de la web). `accentRgb` lo exportamos para
 *                interpolar en rgba() sin volver a hardcodear el hex.
 *   bg         → casi negro, mismo `--color-bg` del site.
 *   foreground → cream off-white igual que el site.
 */
export const OG_COLORS = {
  accent: "#d92d20",
  accentRgb: "217, 45, 32",
  accentDeep: "#a52419",
  bg: "#0e1014",
  surface: "#1a1d24",
  surface2: "#22252e",
  foreground: "#f5efe6",
  muted: "rgba(245, 239, 230, 0.6)",
  mutedStrong: "rgba(245, 239, 230, 0.85)",
  /** Alias legacy para no romper callers; eventualmente borrar. */
  arena: "#d92d20",
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

/**
 * Render genérico de un OG hub: chrome de marca (eyebrow + FWC26 mark
 * arriba, banda inferior con QM mark + URL + chip optional) y un
 * cuerpo central en Big Shoulders con título y subtítulo. Pensado para
 * las páginas tipo /bracket, /calendario, /goleadores… donde no hay
 * datos dinámicos que mostrar.
 */
type BrandedOGProps = {
  /** Texto pequeño en mayúsculas + tracking, color accent. */
  eyebrow: string;
  /** Una o más líneas de title. La 2ª línea va en accent (rojo). */
  title: [string] | [string, string];
  /** Línea de apoyo bajo el title. Opcional. */
  subtitle?: string;
  /** Chip a la derecha de la banda inferior. Opcional. */
  bottomChip?: string;
};

export async function brandedOg(props: BrandedOGProps): Promise<ImageResponse> {
  const [fonts, assets] = await Promise.all([ogFonts(), ogAssets()]);
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background: OG_BG.background,
          color: OG_COLORS.foreground,
          fontFamily: "DMSans",
          position: "relative",
        }}
      >
        {/* Glow esquina superior */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -160,
            right: -160,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background: `radial-gradient(circle, rgba(${OG_COLORS.accentRgb},0.18) 0%, rgba(${OG_COLORS.accentRgb},0) 70%)`,
          }}
        />

        {/* Top */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "44px 80px 0 80px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: 6,
              textTransform: "uppercase",
              color: OG_COLORS.accent,
            }}
          >
            <div style={{ display: "flex", height: 3, width: 50, background: OG_COLORS.accent }} />
            <div style={{ display: "flex" }}>{props.eyebrow}</div>
          </div>
          <img
            src={assets.fwc26DataUrl}
            alt=""
            width={86}
            height={86}
            style={{ width: 86, height: 86 }}
          />
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px 80px 0 80px",
            fontFamily: "BigShoulders",
            fontWeight: 900,
            fontSize: 110,
            lineHeight: 0.95,
            letterSpacing: -2,
            textTransform: "uppercase",
          }}
        >
          {props.title.map((line, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                color: i === 1 ? OG_COLORS.accent : OG_COLORS.foreground,
              }}
            >
              {line}
            </div>
          ))}
        </div>

        {/* Subtitle */}
        {props.subtitle ? (
          <div
            style={{
              display: "flex",
              padding: "24px 80px 0 80px",
              fontSize: 28,
              color: OG_COLORS.mutedStrong,
              lineHeight: 1.35,
              maxWidth: 980,
            }}
          >
            {props.subtitle}
          </div>
        ) : null}

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Banda inferior */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 80px 50px 80px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            <img
              src={assets.qmMarkDataUrl}
              alt=""
              width={56}
              height={56}
              style={{ width: 56, height: 56 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div
                style={{
                  display: "flex",
                  fontFamily: "BigShoulders",
                  fontWeight: 900,
                  fontSize: 26,
                  letterSpacing: -1,
                  textTransform: "uppercase",
                  lineHeight: 1,
                }}
              >
                quinielamundial.es
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 16,
                  fontWeight: 700,
                  letterSpacing: 4,
                  textTransform: "uppercase",
                  color: OG_COLORS.muted,
                }}
              >
                11 jun – 19 jul · USA · CAN · MEX
              </div>
            </div>
          </div>

          {props.bottomChip ? (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 18px",
                borderRadius: 999,
                background: `rgba(${OG_COLORS.accentRgb}, 0.16)`,
                border: `1px solid ${OG_COLORS.accent}`,
                color: OG_COLORS.accent,
                fontWeight: 700,
                fontSize: 16,
                letterSpacing: 3,
                textTransform: "uppercase",
              }}
            >
              <div
                style={{
                  display: "flex",
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: OG_COLORS.accent,
                }}
              />
              {props.bottomChip}
            </div>
          ) : null}
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}

/**
 * Fallback OG si algo peta en el render dinámico (DB caída, fetch a la
 * bandera fallido, lo que sea). Mejor que devolver 500 al crawler.
 */
export async function fallbackOg(): Promise<ImageResponse> {
  const fonts = await ogFonts();
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 28,
          background: OG_COLORS.bg,
          color: OG_COLORS.foreground,
          fontFamily: "DMSans",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: OG_COLORS.accent,
          }}
        >
          Quiniela Mundial · 2026
        </div>
        <div
          style={{
            display: "flex",
            fontFamily: "BigShoulders",
            fontWeight: 900,
            fontSize: 140,
            letterSpacing: -3,
            textTransform: "uppercase",
            lineHeight: 1,
          }}
        >
          quinielamundial.es
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: OG_COLORS.muted,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 700,
          }}
        >
          Predicciones del Mundial 2026
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts },
  );
}
