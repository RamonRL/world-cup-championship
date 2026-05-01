"use server";

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { leagues, profiles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { logAdminAction } from "@/lib/admin/audit";
import { isAdminEmail } from "@/lib/auth/admins";
import { ADMIN_LEAGUE_VIEW_COOKIE, PENDING_INVITE_COOKIE } from "@/lib/leagues";

export type LeagueFormState = { ok: boolean; error?: string; message?: string };

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "liga";
}

const createSchema = z.object({
  name: z.string().trim().min(2).max(60),
  description: z.string().trim().max(280).optional(),
});

export async function createLeague(
  _prev: LeagueFormState,
  formData: FormData,
): Promise<LeagueFormState> {
  const me = await requireAdmin();
  const parsed = createSchema.safeParse({
    name: formData.get("name") ?? "",
    description: (formData.get("description") as string) || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const baseSlug = slugify(parsed.data.name);
  // Slug uniqueness: if collision, append a 4-char random suffix.
  let slug = baseSlug;
  for (let i = 0; i < 5; i++) {
    const [clash] = await db.select({ id: leagues.id }).from(leagues).where(eq(leagues.slug, slug)).limit(1);
    if (!clash) break;
    slug = `${baseSlug}-${randomUUID().slice(0, 4)}`;
  }
  const inviteToken = randomUUID().replace(/-/g, "");

  const [created] = await db
    .insert(leagues)
    .values({
      slug,
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      inviteToken,
      isPublic: false,
      createdBy: me.id,
    })
    .returning();

  await logAdminAction({
    adminId: me.id,
    action: "league.create",
    payload: { id: created.id, slug },
  });

  revalidatePath("/admin/ligas");
  return { ok: true, message: `Creada "${created.name}".` };
}

export async function deleteLeague(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  // Mantén la liga pública intacta — borrarla rompería la app por completo.
  const [target] = await db.select().from(leagues).where(eq(leagues.id, id)).limit(1);
  if (!target || target.isPublic) return;
  // Mueve los miembros a la liga pública para que no queden huérfanos.
  await db
    .update(profiles)
    .set({ leagueId: sql`(SELECT id FROM ${leagues} WHERE is_public = true LIMIT 1)` })
    .where(eq(profiles.leagueId, id));
  await db.delete(leagues).where(eq(leagues.id, id));
  await logAdminAction({ adminId: me.id, action: "league.delete", payload: { id } });
  revalidatePath("/admin/ligas");
}

const rotateSchema = z.object({ id: z.coerce.number().int() });

/**
 * Cambia la liga que el admin está "viendo" (cookie httpOnly). Las queries
 * de ranking, podio, comparar y partidos respetan este id para mostrarle
 * los datos de cualquier liga sin tener que pertenecer a ella.
 *
 * `leagueId` puede ser "default" para borrar la cookie y volver a la liga
 * principal.
 */
export async function setLeagueView(formData: FormData) {
  await requireAdmin();
  const raw = formData.get("leagueId");
  const id = raw === "default" || raw == null || raw === "" ? null : Number(raw);

  const cookieStore = await cookies();
  if (id == null || !Number.isFinite(id)) {
    cookieStore.delete(ADMIN_LEAGUE_VIEW_COOKIE);
  } else {
    cookieStore.set(ADMIN_LEAGUE_VIEW_COOKIE, String(id), {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  // Refresca el shell entero — todas las páginas dynamic se reevalúan.
  revalidatePath("/", "layout");
}

export async function rotateInviteToken(formData: FormData): Promise<LeagueFormState> {
  const me = await requireAdmin();
  const parsed = rotateSchema.safeParse({ id: formData.get("id") });
  if (!parsed.success) return { ok: false, error: "Datos inválidos" };
  const fresh = randomUUID().replace(/-/g, "");
  await db
    .update(leagues)
    .set({ inviteToken: fresh })
    .where(and(eq(leagues.id, parsed.data.id), ne(leagues.isPublic, true)));
  await logAdminAction({
    adminId: me.id,
    action: "league.rotate_invite",
    payload: { id: parsed.data.id },
  });
  revalidatePath("/admin/ligas");
  return { ok: true, message: "Invite link regenerado." };
}

/**
 * Aceptar una invitación. Llamado desde /invite/[token] como server action
 * de un botón. Comportamientos:
 *  - No logueado: setea cookie con el token y redirige a /login. La cookie
 *    la consume getCurrentUser al crear el profile en el primer sight.
 *  - Logueado y admin: la app permite a los admins ver cualquier liga sin
 *    pertenecer a una. Redirige a /admin/ligas.
 *  - Logueado y sin liga (caso raro): asigna y redirige a /dashboard.
 *  - Logueado y misma liga: idempotente, redirige a /dashboard.
 *  - Logueado en otra liga: error explícito (avisa al admin).
 */
export async function acceptInvite(token: string): Promise<{
  status: "redirected_to_login" | "redirected_home" | "joined" | "already_in_other";
  leagueName?: string;
}> {
  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.inviteToken, token), ne(leagues.isPublic, true)))
    .limit(1);
  if (!league) {
    redirect("/dashboard");
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !user.email) {
    const cookieStore = await cookies();
    cookieStore.set(PENDING_INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24, // 24h para completar el login
      path: "/",
    });
    redirect(`/login?next=${encodeURIComponent("/dashboard")}`);
  }

  if (isAdminEmail(user.email)) {
    redirect("/admin/ligas");
  }

  const [me] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);
  if (!me) {
    // Aún no tiene profile (login a medias). Setea cookie y redirige a
    // la app para que getCurrentUser lo cree con la liga correcta.
    const cookieStore = await cookies();
    cookieStore.set(PENDING_INVITE_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });
    redirect("/dashboard");
  }

  if (me.leagueId === league.id) {
    redirect("/dashboard");
  }
  if (me.leagueId != null) {
    return { status: "already_in_other", leagueName: league.name };
  }
  // Sin liga → asignar.
  await db.update(profiles).set({ leagueId: league.id }).where(eq(profiles.id, me.id));
  redirect("/dashboard");
}
