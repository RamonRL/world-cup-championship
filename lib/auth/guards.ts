import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagueMemberships, leagues, profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { PENDING_INVITE_COOKIE, getPublicLeague } from "@/lib/leagues";
import { isAdminEmail } from "./admins";

export type CurrentUser = {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  /** Liga a la que pertenece el participante. `null` para admins. */
  leagueId: number | null;
  bannedAt: Date | null;
};

/**
 * Resolve the currently logged-in user (auth + profile). Side-effect free
 * other than auto-creating the profile row on first sight, flipping role
 * from `user` → `admin` when the email matches `ADMIN_EMAILS`, y
 * consumiendo la cookie `pending_league_token` si el usuario llegó por un
 * invite link y aún no tiene liga asignada.
 */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) return null;

  const expectedRole: "user" | "admin" = isAdminEmail(user.email) ? "admin" : "user";

  const [existing] = await db.select().from(profiles).where(eq(profiles.id, user.id)).limit(1);

  if (!existing) {
    // Primer login. Liga activa:
    //   - Si hay invite cookie válida → liga del invite (skipea onboarding).
    //   - Si no → NULL → el guard del layout redirige a /onboarding para
    //     que el usuario elija pública o privada.
    // Memberships: la pública es IMPLÍCITA y PERMANENTE — la insertamos
    // siempre. Si llega por invite, también la privada del invite.
    const inviteLeagueId = await resolveInviteLeague();
    const pub = await getPublicLeague();
    const activeLeagueId = inviteLeagueId ?? null;

    const [created] = await db
      .insert(profiles)
      .values({
        id: user.id,
        email: user.email,
        role: expectedRole,
        leagueId: activeLeagueId,
      })
      .returning();

    const memberships: { userId: string; leagueId: number }[] = [];
    if (pub) memberships.push({ userId: user.id, leagueId: pub.id });
    if (inviteLeagueId && inviteLeagueId !== pub?.id) {
      memberships.push({ userId: user.id, leagueId: inviteLeagueId });
    }
    if (memberships.length > 0) {
      await db.insert(leagueMemberships).values(memberships).onConflictDoNothing();
    }

    await consumeInviteCookie();
    return mapProfile(created);
  }

  // Promote/demote if email allowlist diverges.
  if (existing.role !== expectedRole) {
    const [updated] = await db
      .update(profiles)
      .set({ role: expectedRole })
      .where(eq(profiles.id, user.id))
      .returning();
    return mapProfile(updated);
  }

  return mapProfile(existing);
}

/**
 * Lee la cookie `pending_league_token` y devuelve el id de la liga privada
 * correspondiente, o null si no hay cookie o el token no resuelve. NO borra
 * la cookie — eso lo hace `consumeInviteCookie` tras insertar el perfil
 * con éxito.
 */
async function resolveInviteLeague(): Promise<number | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PENDING_INVITE_COOKIE)?.value;
  if (!token) return null;
  const [row] = await db
    .select({ id: leagues.id })
    .from(leagues)
    .where(and(eq(leagues.inviteToken, token), ne(leagues.isPublic, true)))
    .limit(1);
  return row?.id ?? null;
}

async function consumeInviteCookie() {
  const cookieStore = await cookies();
  if (cookieStore.get(PENDING_INVITE_COOKIE)) {
    cookieStore.delete(PENDING_INVITE_COOKIE);
  }
}

export async function requireUser(): Promise<CurrentUser> {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.bannedAt) redirect("/login?reason=banned");
  return me;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const me = await requireUser();
  if (me.role !== "admin") redirect("/dashboard?error=forbidden");
  return me;
}

function mapProfile(row: typeof profiles.$inferSelect): CurrentUser {
  return {
    id: row.id,
    email: row.email,
    nickname: row.nickname,
    avatarUrl: row.avatarUrl,
    role: row.role,
    leagueId: row.leagueId,
    bannedAt: row.bannedAt,
  };
}
