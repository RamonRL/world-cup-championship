import type { MetadataRoute } from "next";

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Quiniela Mundial";

/**
 * Web App Manifest. Habilita la instalación como PWA en Android (Chrome,
 * Samsung Internet) y refuerza el modo standalone que Safari ya conoce vía
 * los meta tags apple-mobile-web-app-* de app/layout.tsx.
 *
 * `display: "standalone"` quita la barra del navegador en TODAS las
 * pestañas — no solo la inicial.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: APP_NAME,
    short_name: APP_NAME,
    description: "Quiniela y seguimiento del Mundial 2026.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0e1014",
    theme_color: "#0e1014",
    lang: "es",
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon.png",
        sizes: "180x180",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
