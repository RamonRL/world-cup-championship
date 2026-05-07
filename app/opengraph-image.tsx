import { ImageResponse } from "next/og";
import { ogFonts } from "@/lib/og-fonts";

export const runtime = "nodejs";
export const alt = "Quiniela Mundial 2026 — predicciones del Mundial entre amigos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * OG image principal del sitio. Renderizada con next/og + Satori. Las
 * fuentes Inter se cargan explícitamente para evitar fallbacks que
 * generan solapamiento de texto. Layout 100% flex (sin position:
 * absolute) para que Satori lo componga sin sorpresas.
 */
export default async function OpenGraphImage() {
  const fonts = await ogFonts();
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
          fontFamily: "Inter",
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
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#d97742",
          }}
        >
          <div style={{ display: "flex", height: 3, width: 60, background: "#d97742" }} />
          <span>Quiniela Mundial · 2026</span>
        </div>

        {/* Title — un solo div con line-height generoso para que las dos
            líneas no se peleen verticalmente. */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontWeight: 900,
            fontSize: 110,
            lineHeight: 1.05,
            letterSpacing: -2,
          }}
        >
          <div style={{ display: "flex" }}>Predice</div>
          <div style={{ display: "flex", color: "#d97742" }}>los 104 partidos.</div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "rgba(245, 239, 230, 0.78)",
            lineHeight: 1.3,
            maxWidth: 900,
          }}
        >
          Calendario, grupos, bracket FIFA y goleadores. Compite con tus amigos.
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
              gap: 20,
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 4,
              textTransform: "uppercase",
              color: "rgba(245, 239, 230, 0.7)",
            }}
          >
            <span>quinielamundial.es</span>
            <Dot />
            <span>11 jun – 19 jul</span>
            <Dot />
            <span>USA · CAN · MEX</span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 100,
              width: 100,
              borderRadius: 22,
              background: "#d97742",
              color: "#0e1014",
              fontWeight: 900,
              fontSize: 50,
              letterSpacing: -2,
            }}
          >
            QM
          </div>
        </div>
      </div>
    ),
    { ...size, fonts },
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
