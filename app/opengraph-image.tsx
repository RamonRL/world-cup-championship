import { ImageResponse } from "next/og";
import { OG_BG, OG_COLORS, ogAssets, ogFonts } from "@/lib/og-assets";

export const runtime = "nodejs";
export const alt = "Quiniela Mundial 2026 — predicciones del Mundial entre amigos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image principal del sitio. Layout:
 *   ┌────────────────────────────────────────────┐
 *   │ [— QUINIELA MUNDIAL · 2026]      [FWC26]   │
 *   │                                            │
 *   │ PREDICE                                    │
 *   │ EL MUNDIAL                                 │
 *   │                                            │
 *   │ Calendario, los 12 grupos, bracket FIFA…   │
 *   │                                            │
 *   │ [QM] quinielamundial.es     [FIFA WC 26]   │
 *   │      11 jun – 19 jul · USA · CAN · MEX     │
 *   └────────────────────────────────────────────┘
 */
export default async function OpenGraphImage() {
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
        {/* Glow esquina superior derecha — sutil, replica la nebulosa
            arena de la landing. */}
        <div
          style={{
            display: "flex",
            position: "absolute",
            top: -160,
            right: -160,
            width: 480,
            height: 480,
            borderRadius: 9999,
            background:
              `radial-gradient(circle, rgba(${OG_COLORS.accentRgb},0.18) 0%, rgba(${OG_COLORS.accentRgb},0) 70%)`,
          }}
        />

        {/* Top: eyebrow + FWC26 mark */}
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
              color: OG_COLORS.arena,
            }}
          >
            <div style={{ display: "flex", height: 3, width: 50, background: OG_COLORS.arena }} />
            <div style={{ display: "flex" }}>Quiniela Mundial · 2026</div>
          </div>
          <img
            src={assets.fwc26DataUrl}
            alt=""
            width={86}
            height={86}
            style={{ width: 86, height: 86 }}
          />
        </div>

        {/* Headline — Big Shoulders, ahora a la mitad (100px) */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            padding: "32px 80px 0 80px",
            fontFamily: "BigShoulders",
            fontWeight: 900,
            fontSize: 100,
            lineHeight: 0.95,
            letterSpacing: -2,
            textTransform: "uppercase",
          }}
        >
          <div style={{ display: "flex" }}>Predice</div>
          <div style={{ display: "flex", color: OG_COLORS.arena }}>el Mundial</div>
        </div>

        {/* Subtítulo */}
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
          Calendario, los 12 grupos, bracket FIFA y máximos goleadores. Compite con tus amigos.
        </div>

        {/* Spacer */}
        <div style={{ display: "flex", flex: 1 }} />

        {/* Banda inferior: QM mark + URL/dates a la izda · chip FIFA a la dcha.
            Todo alineado vertical (centerY) para que ningún elemento
            "flote" debajo del bloque. */}
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

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "10px 18px",
              borderRadius: 999,
              background: `rgba(${OG_COLORS.accentRgb}, 0.16)`,
              border: `1px solid ${OG_COLORS.arena}`,
              color: OG_COLORS.arena,
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
                background: OG_COLORS.arena,
              }}
            />
            FIFA World Cup 26
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
  );
}
