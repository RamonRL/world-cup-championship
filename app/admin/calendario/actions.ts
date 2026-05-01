"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchdays, matches } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/admin/audit";

export type FormState = { ok: boolean; error?: string };

const matchdaySchema = z.object({
  id: z.coerce.number().optional(),
  name: z.string().min(2).max(60),
  stage: z.enum(["group", "r32", "r16", "qf", "sf", "third", "final"]),
  predictionDeadlineAt: z.string().min(1),
  orderIndex: z.coerce.number().int().default(0),
});

export async function upsertMatchday(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  const parsed = matchdaySchema.safeParse({
    id: formData.get("id") ?? undefined,
    name: formData.get("name"),
    stage: formData.get("stage"),
    predictionDeadlineAt: formData.get("predictionDeadlineAt"),
    orderIndex: formData.get("orderIndex") ?? 0,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = {
    name: parsed.data.name,
    stage: parsed.data.stage,
    predictionDeadlineAt: new Date(parsed.data.predictionDeadlineAt),
    orderIndex: parsed.data.orderIndex,
  };
  if (parsed.data.id) {
    await db.update(matchdays).set(data).where(eq(matchdays.id, parsed.data.id));
    await logAdminAction({
      adminId: me.id,
      action: "matchday.update",
      payload: { id: parsed.data.id },
    });
  } else {
    const [created] = await db.insert(matchdays).values(data).returning();
    await logAdminAction({
      adminId: me.id,
      action: "matchday.create",
      payload: { id: created.id },
    });
  }
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function deleteMatchday(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(matchdays).where(eq(matchdays.id, id));
  await logAdminAction({ adminId: me.id, action: "matchday.delete", payload: { id } });
  revalidatePath("/admin/calendario");
}

const matchSchema = z.object({
  id: z.coerce.number().optional(),
  code: z.string().min(2).max(16),
  stage: z.enum(["group", "r32", "r16", "qf", "sf", "third", "final"]),
  matchdayId: z.coerce.number().int().optional().nullable(),
  groupId: z.coerce.number().int().optional().nullable(),
  homeTeamId: z.coerce.number().int().optional().nullable(),
  awayTeamId: z.coerce.number().int().optional().nullable(),
  scheduledAt: z.string().min(1),
  venue: z.string().max(120).optional(),
});

export async function upsertMatch(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  // Los Selects de equipos / grupo usan el centinela "none" para representar
  // "sin definir" — necesario para que en eliminatorias el admin pueda
  // crear partidos sin saber aún quién juega. Lo mapeamos a null antes de
  // llegar al schema zod.
  const optionalRef = (raw: FormDataEntryValue | null) =>
    raw == null || raw === "" || raw === "none" ? null : raw;

  const parsed = matchSchema.safeParse({
    id: formData.get("id") ?? undefined,
    code: formData.get("code"),
    stage: formData.get("stage"),
    matchdayId: optionalRef(formData.get("matchdayId")),
    groupId: optionalRef(formData.get("groupId")),
    homeTeamId: optionalRef(formData.get("homeTeamId")),
    awayTeamId: optionalRef(formData.get("awayTeamId")),
    scheduledAt: formData.get("scheduledAt"),
    venue: formData.get("venue") ?? "",
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }
  const data = {
    code: parsed.data.code,
    stage: parsed.data.stage,
    matchdayId: parsed.data.matchdayId ?? null,
    groupId: parsed.data.groupId ?? null,
    homeTeamId: parsed.data.homeTeamId ?? null,
    awayTeamId: parsed.data.awayTeamId ?? null,
    scheduledAt: new Date(parsed.data.scheduledAt),
    venue: parsed.data.venue ?? null,
  };
  if (parsed.data.id) {
    await db.update(matches).set(data).where(eq(matches.id, parsed.data.id));
    await logAdminAction({ adminId: me.id, action: "match.update", payload: { id: parsed.data.id } });
  } else {
    const [created] = await db.insert(matches).values(data).returning();
    await logAdminAction({ adminId: me.id, action: "match.create", payload: { id: created.id } });
  }
  revalidatePath("/admin/calendario");
  revalidatePath("/calendario");
  return { ok: true };
}

export async function deleteMatch(formData: FormData) {
  const me = await requireAdmin();
  const id = Number(formData.get("id"));
  await db.delete(matches).where(eq(matches.id, id));
  await logAdminAction({ adminId: me.id, action: "match.delete", payload: { id } });
  revalidatePath("/admin/calendario");
}
