import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Quiniela Mundial 2026 — predicciones del Mundial entre amigos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image principal del sitio. Se renderiza en el edge runtime con
 * next/og (basado en Satori). Composición: marca arena en grande, tagline
 * editorial debajo y banda inferior con la URL del sitio. No usamos
 * <Image src="/fwc26.png" /> porque ImageResponse no resuelve assets
 * locales directamente — el resultado vectorial sale igual de bonito.
 */
export default async function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          background:
            "linear-gradient(135deg, #1a1d24 0%, #2a1f15 60%, #3d2914 100%)",
          color: "#f5efe6",
          padding: "80px 100px",
          position: "relative",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: "monospace",
            fontSize: 22,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "#d97742",
          }}
        >
          <span
            style={{
              display: "block",
              height: 3,
              width: 60,
              background: "#d97742",
            }}
          />
          Quiniela Mundial · 2026
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: 60,
            fontWeight: 800,
            fontSize: 132,
            lineHeight: 0.95,
            letterSpacing: "-0.02em",
          }}
        >
          <span>predice</span>
          <span style={{ color: "#d97742" }}>los 104 partidos.</span>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            marginTop: 50,
            fontSize: 36,
            fontStyle: "italic",
            color: "rgba(245, 239, 230, 0.8)",
            maxWidth: 880,
            lineHeight: 1.2,
          }}
        >
          Calendario, grupos, bracket FIFA y goleadores. Compite con tus amigos.
        </div>

        {/* Bottom strip */}
        <div
          style={{
            position: "absolute",
            left: 100,
            bottom: 60,
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontFamily: "monospace",
            fontSize: 26,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "rgba(245, 239, 230, 0.7)",
          }}
        >
          <span>quinielamundial.es</span>
          <span style={{ display: "block", height: 6, width: 6, background: "#d97742", borderRadius: 6 }} />
          <span>11 jun – 19 jul</span>
          <span style={{ display: "block", height: 6, width: 6, background: "#d97742", borderRadius: 6 }} />
          <span>Canadá · México · USA</span>
        </div>

        {/* Decorative corner mark */}
        <div
          style={{
            position: "absolute",
            right: 100,
            bottom: 60,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: 110,
            width: 110,
            borderRadius: 24,
            background: "#d97742",
            color: "#0e1014",
            fontWeight: 900,
            fontSize: 56,
            letterSpacing: "-0.04em",
          }}
        >
          QM
        </div>
      </div>
    ),
    { ...size },
  );
}
