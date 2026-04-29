"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/admin/audit";

export async function setUserBanned(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId"));
  const banned = formData.get("banned") === "1";

  await db
    .update(profiles)
    .set({ bannedAt: banned ? new Date() : null })
    .where(eq(profiles.id, userId));

  await logAdminAction({
    adminId: me.id,
    action: banned ? "user.ban" : "user.unban",
    payload: { userId },
  });

  revalidatePath("/admin/usuarios");
  revalidatePath("/admin/chat");
}

export async function setUserRole(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId"));
  const role = String(formData.get("role")) as "user" | "admin";
  if (role !== "user" && role !== "admin") return;

  await db.update(profiles).set({ role }).where(eq(profiles.id, userId));

  await logAdminAction({
    adminId: me.id,
    action: "user.role",
    payload: { userId, role },
  });

  revalidatePath("/admin/usuarios");
}
