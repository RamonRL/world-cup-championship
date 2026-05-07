import { ImageResponse } from "next/og";

export const runtime = "nodejs";
export const alt = "Quiniela Mundial 2026 — predicciones del Mundial entre amigos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image principal del sitio. Renderizada con next/og + Satori. La
 * fuente fallback de Satori es sans-serif sólida; lo que daba el
 * "solapamiento" era line-height demasiado ajustado (0.95) + tamaños
 * extremos (132px) + position:absolute. Aquí usamos solo flex y métricas
 * conservadoras.
 */
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background:
            "linear-gradient(135deg, #1a1d24 0%, #2a1f15 60%, #3d2914 100%)",
          color: "#f5efe6",
          padding: "70px 90px",
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            fontWeight: 700,
            fontSize: 22,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#d97742",
          }}
        >
          <div style={{ display: "flex", height: 3, width: 60, background: "#d97742" }} />
          <div style={{ display: "flex" }}>Quiniela Mundial · 2026</div>
        </div>

        {/* Title — line-height 1.15 (no apretado) y font-size 96
            (lejos del extremo). */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontWeight: 800,
            fontSize: 96,
            lineHeight: 1.15,
            letterSpacing: -1,
          }}
        >
          <div style={{ display: "flex" }}>Predice los 104 partidos.</div>
          <div style={{ display: "flex", color: "#d97742" }}>Compite con tus amigos.</div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 30,
            color: "rgba(245, 239, 230, 0.78)",
            lineHeight: 1.4,
            maxWidth: 900,
          }}
        >
          Calendario, los 12 grupos, bracket FIFA y máximos goleadores. Todo el Mundial 2026 en un sitio.
        </div>

        {/* Bottom strip — flex row, sin absolute */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 18,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(245, 239, 230, 0.7)",
            }}
          >
            <div style={{ display: "flex" }}>quinielamundial.es</div>
            <Dot />
            <div style={{ display: "flex" }}>11 jun – 19 jul</div>
            <Dot />
            <div style={{ display: "flex" }}>USA · CAN · MEX</div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 92,
              width: 92,
              borderRadius: 20,
              background: "#d97742",
              color: "#0e1014",
              fontWeight: 800,
              fontSize: 44,
              letterSpacing: -1,
            }}
          >
            QM
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}

function Dot() {
  return (
    <div
      style={{
        display: "flex",
        height: 6,
        width: 6,
        background: "#d97742",
        borderRadius: 6,
      }}
    />
  );
}
