"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { specialPredictions } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/admin/audit";
import { recomputeSpecialPredictionForAllUsers } from "@/lib/scoring/persistence";

export type FormState = { ok: boolean; error?: string };

const resolveSchema = z.object({
  specialId: z.coerce.number().int(),
  resolvedJson: z.string().min(1),
  clear: z.coerce.boolean().default(false),
});

/**
 * Set the resolved value (or clear it) for a special prediction. Triggers a
 * recompute of points across all users for that special.
 */
export async function resolveSpecial(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = resolveSchema.safeParse({
    specialId: formData.get("specialId"),
    resolvedJson: formData.get("resolvedJson") ?? "{}",
    clear: formData.get("clear") === "1",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos." };
  }

  if (parsed.data.clear) {
    await db
      .update(specialPredictions)
      .set({ resolvedValueJson: null, resolvedAt: null })
      .where(eq(specialPredictions.id, parsed.data.specialId));
    await logAdminAction({
      adminId: me.id,
      action: "special.unresolve",
      payload: { specialId: parsed.data.specialId },
    });
  } else {
    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(parsed.data.resolvedJson);
    } catch {
      return { ok: false, error: "El valor resuelto no es JSON válido." };
    }
    await db
      .update(specialPredictions)
      .set({ resolvedValueJson: parsedValue as unknown, resolvedAt: new Date() })
      .where(eq(specialPredictions.id, parsed.data.specialId));
    await logAdminAction({
      adminId: me.id,
      action: "special.resolve",
      payload: { specialId: parsed.data.specialId, value: parsedValue },
    });
  }

  await recomputeSpecialPredictionForAllUsers(parsed.data.specialId);
  revalidatePath("/admin/especiales");
  revalidatePath("/ranking");
  return { ok: true };
}
