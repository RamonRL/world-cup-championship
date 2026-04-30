"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          margin: 0,
          padding: 24,
          fontFamily: "system-ui, sans-serif",
          background: "#0a0a0a",
          color: "#f5f5f5",
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: 24, margin: 0, letterSpacing: "-0.02em" }}>
          Algo se rompió.
        </h1>
        <p style={{ margin: 0, color: "#a3a3a3", maxWidth: 360 }}>
          Error inesperado al cargar la app. Recarga la página; si vuelve a fallar,
          pásale el código de abajo al admin.
        </p>
        <button
          onClick={reset}
          style={{
            padding: "8px 16px",
            borderRadius: 6,
            border: "1px solid #333",
            background: "#1a1a1a",
            color: "#f5f5f5",
            cursor: "pointer",
          }}
        >
          Reintentar
        </button>
        {error.digest ? (
          <p style={{ margin: 0, fontFamily: "monospace", fontSize: 11, color: "#737373" }}>
            digest · {error.digest}
          </p>
        ) : null}
      </body>
    </html>
  );
}
