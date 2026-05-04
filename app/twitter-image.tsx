// Reutilizamos exactamente el OG image como Twitter card. Next se encarga
// de exponerlo en /twitter-image y de inyectar la meta `twitter:image` con
// `card: "summary_large_image"` (declarado en app/layout.tsx).
export {
  default,
  alt,
  size,
  contentType,
  runtime,
} from "./opengraph-image";
