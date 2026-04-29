"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { chatMessages, profiles } from "@/lib/db/schema";
import { requireAdmin, requireUser } from "@/lib/auth/guards";

export type FormState = { ok: boolean; error?: string };

const schema = z.object({
  scope: z.enum(["global", "match"]),
  matchId: z.coerce.number().int().optional().nullable(),
  body: z.string().trim().min(1).max(1000),
});

export async function sendMessage(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireUser();
  if (me.bannedAt) return { ok: false, error: "Tu cuenta está suspendida." };
  const parsed = schema.safeParse({
    scope: formData.get("scope"),
    matchId: formData.get("matchId") || null,
    body: formData.get("body"),
  });
  if (!parsed.success) return { ok: false, error: "Mensaje vacío o demasiado largo." };

  await db.insert(chatMessages).values({
    scope: parsed.data.scope,
    matchId: parsed.data.scope === "match" ? parsed.data.matchId ?? null : null,
    userId: me.id,
    body: parsed.data.body,
  });

  if (parsed.data.scope === "global") revalidatePath("/chat");
  if (parsed.data.scope === "match" && parsed.data.matchId) {
    revalidatePath(`/partido/${parsed.data.matchId}`);
  }
  return { ok: true };
}

export async function deleteMessage(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  if (!Number.isFinite(id)) return;
  await db
    .update(chatMessages)
    .set({ deletedAt: new Date(), deletedBy: me.id })
    .where(eq(chatMessages.id, id));
  revalidatePath("/chat");
  revalidatePath("/admin/chat");
}

export async function banUser(formData: FormData) {
  const me = await requireAdmin();
  const userId = String(formData.get("userId"));
  await db.update(profiles).set({ bannedAt: new Date() }).where(eq(profiles.id, userId));
  void me;
  revalidatePath("/admin/usuarios");
  revalidatePath("/chat");
}
