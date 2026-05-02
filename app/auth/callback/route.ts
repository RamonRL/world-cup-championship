import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/guards";
import { PENDING_INVITE_COOKIE, joinLeagueByInviteToken } from "@/lib/leagues";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";

  if (!code) {
    return NextResponse.redirect(new URL(`/auth/error?reason=missing_code`, request.url));
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      new URL(`/auth/error?reason=${encodeURIComponent(error.message)}`, request.url),
    );
  }

  // Ensure profile row exists and role is in sync with ADMIN_EMAILS allowlist.
  const me = await getCurrentUser();

  // Para usuarios EXISTENTES que vuelven a entrar tras pulsar un invite
  // link, getCurrentUser no consume la cookie (sólo lo hace al crear el
  // profile). La consumimos aquí: si hay token pendiente, le añadimos la
  // membership y la marcamos como activa.
  if (me) {
    const cookieStore = await cookies();
    const pending = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
    if (pending) {
      const result = await joinLeagueByInviteToken(me.id, pending);
      cookieStore.delete(PENDING_INVITE_COOKIE);
      if (
        !result.ok &&
        result.reason === "private_limit_reached" &&
        result.leagueName
      ) {
        return NextResponse.redirect(
          new URL(
            `/dashboard?invite_error=${encodeURIComponent(`Ya tienes 5 quinielas privadas. Para unirte a "${result.leagueName}" abandona alguna desde tu perfil.`)}`,
            request.url,
          ),
        );
      }
      // El profile ya tiene leagueId actualizado por el helper.
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Cuenta nueva sin invite cookie → leagueId NULL → onboarding.
  if (me && me.leagueId == null) {
    return NextResponse.redirect(new URL("/onboarding", request.url));
  }

  return NextResponse.redirect(new URL(next, request.url));
}
