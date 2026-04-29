import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "./admins";

export type CurrentUser = {
  id: string;
  email: string;
  nickname: string | null;
  avatarUrl: string | null;
  role: "user" | "admin";
  bannedAt: Date | null;
};

/**
 * Resolve the currently logged-in user (auth + profile). Side-effect free other
 * than auto-creating the profile row on first sight, and flipping role from
 * `user` → `admin` when the email matches `ADMIN_EMAILS`.
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
    const [created] = await db
      .insert(profiles)
      .values({
        id: user.id,
        email: user.email,
        role: expectedRole,
      })
      .returning();
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
    bannedAt: row.bannedAt,
  };
}
