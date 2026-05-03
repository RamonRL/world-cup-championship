import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Run on all routes except:
     * - _next static & images
     * - public files (svg, png, jpg, jpeg, gif, webp, avif, ico, webmanifest)
     * - manifest.webmanifest (PWA — debe ser pública sin auth round-trip)
     * - api routes (we keep them stateless; auth checks run inside)
     */
    "/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|webmanifest)$).*)",
  ],
};
