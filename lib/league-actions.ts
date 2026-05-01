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
import { createSupabaseServerClient, createSupabaseServiceClient } from "@/lib/supabase/server";
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

/**
 * Mueve a un usuario a otra liga. Llamado desde la pestaña de gestión de
 * cada liga (/admin/ligas/[id]). leagueId puede ser un id válido o "none"
 * para dejar al usuario sin liga (volverá a la principal en su próximo
 * `currentLeagueId`).
 */
export async function moveUserToLeague(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  const leagueRaw = formData.get("leagueId");
  if (!userId) return;
  let leagueId: number | null;
  if (leagueRaw === "none" || leagueRaw === "" || leagueRaw == null) {
    leagueId = null;
  } else {
    const n = Number(leagueRaw);
    leagueId = Number.isFinite(n) ? n : null;
  }

  // Lee la liga anterior para revalidar también su path.
  const [before] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);
  await db.update(profiles).set({ leagueId }).where(eq(profiles.id, userId));

  await logAdminAction({
    adminId: me.id,
    action: "league.move_user",
    payload: { userId, from: before?.leagueId ?? null, to: leagueId },
  });

  revalidatePath("/admin/ligas");
  if (before?.leagueId != null) revalidatePath(`/admin/ligas/${before.leagueId}`);
  if (leagueId != null) revalidatePath(`/admin/ligas/${leagueId}`);
  // Las queries filtradas por liga en /ranking, /dashboard, etc. dependen
  // del league_id del profile, así que revalidamos el shell entero.
  revalidatePath("/", "layout");
}

/**
 * Hard-delete del usuario. Borra el profile (cascades wipe predicciones,
 * puntos, chat) y borra también el `auth.users` row vía Supabase admin
 * API para invalidar la sesión y forzar un login fresco. Está pensado
 * para limpiar un participante por completo, no para suspender — si lo
 * único que quieres es "echarlo y que vuelva a entrar como nuevo", da
 * lo mismo: tras esto, el siguiente magic-link crea un profile vacío.
 */
export async function hardDeleteUser(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId") ?? "");
  if (!userId) return;
  // Salvaguarda: el admin no puede borrarse a sí mismo desde aquí.
  if (userId === me.id) {
    throw new Error("No puedes eliminar tu propia cuenta de admin desde aquí.");
  }

  const [before] = await db.select().from(profiles).where(eq(profiles.id, userId)).limit(1);

  // 1. Borra profile. ON DELETE CASCADE wipea predicciones, puntos, chat,
  //    match_scorers (si aplica) — toda la huella del usuario.
  await db.delete(profiles).where(eq(profiles.id, userId));

  // 2. Borra el auth.users row vía Supabase admin API. Esto invalida
  //    su sesión actual y obliga a re-autenticarse para volver a entrar.
  try {
    const supabase = createSupabaseServiceClient();
    await supabase.auth.admin.deleteUser(userId);
  } catch (err) {
    // Si la ruta admin falla (p.ej. el user ya no existe), seguimos —
    // lo importante era limpiar nuestros datos.
    console.warn("supabase.auth.admin.deleteUser falló:", err);
  }

  await logAdminAction({
    adminId: me.id,
    action: "user.hard_delete",
    payload: { userId, leagueId: before?.leagueId ?? null },
  });

  revalidatePath("/admin/ligas");
  if (before?.leagueId != null) revalidatePath(`/admin/ligas/${before.leagueId}`);
  revalidatePath("/admin/usuarios");
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
