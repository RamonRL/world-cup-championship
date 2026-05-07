// Reutilizamos exactamente el OG image como Twitter card. Next se encarga
// de exponerlo en /twitter-image y de inyectar la meta `twitter:image` con
// `card: "summary_large_image"` (declarado en app/layout.tsx).
//
// Nota: `runtime` se redeclara aquí en vez de re-exportarse, porque Next.js
// solo lo reconoce si es un literal de string en el archivo (no un re-export).
export const runtime = "nodejs";
export { default, alt, size, contentType } from "./opengraph-image";
