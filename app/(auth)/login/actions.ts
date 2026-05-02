"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

async function getOrigin() {
  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") ?? headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") ?? "http";
  return host ? `${proto}://${host}` : "http://localhost:3000";
}

/**
 * Kicks off Google OAuth via Supabase. Returns the provider URL and redirects
 * the browser to it. Supabase will redirect back to /auth/callback after the
 * user approves on Google's side.
 */
export async function signInWithGoogle(formData: FormData) {
  const supabase = await createSupabaseServerClient();
  const origin = await getOrigin();
  const next = formData.get("next")?.toString() ?? "/dashboard";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect(`/auth/error?reason=${encodeURIComponent(error?.message ?? "oauth_failed")}`);
  }
  redirect(data.url);
}
