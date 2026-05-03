import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

// Rutas que NO requieren sesión. Crítico que aquí estén los recursos
// PWA (manifest) y la landing del invite link, porque si el middleware
// las redirige se rompe la instalación de la PWA y los invites
// inválidos generan loops de 307→/login en cada navegación.
const PUBLIC_PATHS = [
  "/login",
  "/auth/callback",
  "/auth/error",
  "/invite",
  "/manifest.webmanifest",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));

  // Skip getUser() para rutas públicas: ahorra un round-trip a Supabase
  // en cada navegación (Chrome refetcha manifest.webmanifest a menudo;
  // si pasaba por el middleware completo, era un cuello de botella).
  if (isPublic) {
    return response;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return response;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
