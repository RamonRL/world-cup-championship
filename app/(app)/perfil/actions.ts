"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { uploadImage } from "@/lib/storage";

export type FormState = { ok: boolean; error?: string };

const schema = z.object({
  nickname: z
    .string()
    .max(40)
    .optional()
    .transform((v) => (v?.trim() ? v.trim() : null)),
});

export async function updateProfile(_prev: FormState, formData: FormData): Promise<FormState> {
  const me = await requireUser();
  const parsed = schema.safeParse({ nickname: formData.get("nickname") ?? "" });
  if (!parsed.success) {
    return { ok: false, error: "Nickname inválido (máx 40 chars)." };
  }

  const update: Record<string, unknown> = { nickname: parsed.data.nickname };

  const avatar = formData.get("avatar");
  if (avatar instanceof File && avatar.size > 0) {
    const url = await uploadImage({
      kind: "avatar",
      path: `${me.id}.png`,
      file: avatar,
    });
    update.avatarUrl = url;
  }

  await db.update(profiles).set(update).where(eq(profiles.id, me.id));
  revalidatePath("/perfil");
  revalidatePath("/dashboard");
  revalidatePath("/ranking");
  return { ok: true };
}
