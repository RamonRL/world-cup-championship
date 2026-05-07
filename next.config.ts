import type { NextConfig } from "next";

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : null;

const nextConfig: NextConfig = {
  images: {
    remotePatterns: supabaseHostname
      ? [{ protocol: "https", hostname: supabaseHostname, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  // Forzamos a Next a empaquetar las fuentes y logos PNG con las funciones
  // de OG image. Por defecto los archivos de `public/` NO se bundlean con
  // serverless functions (se sirven desde la edge estática), así que un
  // `readFile` desde dentro del handler revienta con ENOENT en Vercel.
  outputFileTracingIncludes: {
    "/**": [
      "./public/fonts/**",
      "./public/fwc26.png",
      "./public/qm-mark.png",
    ],
  },
};

export default nextConfig;
