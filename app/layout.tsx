import type { Metadata, Viewport } from "next";
import {
  Big_Shoulders,
  DM_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { NavigationProgress } from "@/components/shell/navigation-progress";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans-loaded",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const bigShoulders = Big_Shoulders({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "700", "800", "900"],
  variable: "--font-display-loaded",
  display: "swap",
});

// Instrument Serif: italic editorial moderno, más sobrio que Fraunces.
// Se renderiza para descripciones y prose ("Lo último de la cancha.",
// fechas, dichos). Solo viene en weight 400 + italic 400 — suficiente
// porque todas las usages son italic.
const instrumentSerif = Instrument_Serif({
  subsets: ["latin", "latin-ext"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-editorial-loaded",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono-loaded",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Quiniela Mundial";

// Forzamos el mismo título en todas las pestañas: aunque cada página
// declare su propio metadata.title, el template sin %s lo ignora y
// renderiza siempre "Quiniela Mundial". Cambia con NEXT_PUBLIC_APP_NAME
// si en algún momento queremos otro nombre global.
export const metadata: Metadata = {
  title: {
    default: appName,
    template: appName,
  },
  description: "Quiniela y seguimiento del Mundial 2026 entre amigos.",
  applicationName: appName,
  formatDetection: { telephone: false, email: false, address: false },
  // ─── PWA (iOS + Android) ──────────────────────────────────────────
  // appleWebApp = meta tags apple-mobile-web-app-* que hacen que Safari
  // abra la app en modo standalone (sin barra de navegación) al
  // lanzarla desde el icono del Home Screen. Sin esto, las páginas
  // distintas de la del start_url se abren con la chrome de Safari.
  // statusBarStyle "black-translucent" hace que el contenido suba bajo
  // el status bar para sensación full-bleed.
  appleWebApp: {
    capable: true,
    title: appName,
    statusBarStyle: "black-translucent",
  },
  // El manifest.webmanifest se genera en app/manifest.ts. Chrome/Android
  // lo usa para abrir la app en modo standalone tras "Añadir a la
  // pantalla de inicio".
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#0e1014" },
  ],
  width: "device-width",
  initialScale: 1,
  // Bloquea pinch-zoom en móvil para que la app se sienta nativa: la
  // navegación bottom-bar y los controles tap-friendly ya están
  // dimensionados para el tamaño real, y el zoom accidental rompe la
  // composición (especialmente el live HUD y el bracket en mobile).
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${dmSans.variable} ${bigShoulders.variable} ${instrumentSerif.variable} ${jetbrains.variable}`}
    >
      <body>
        <ThemeProvider>
          <NavigationProgress />
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
