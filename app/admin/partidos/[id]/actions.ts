"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { matchScorers, matches } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { logAdminAction } from "@/lib/admin/audit";
import { recomputeMatchScoringForAllUsers } from "@/lib/scoring/persistence";

export type FormState = { ok: boolean; error?: string };

const scorerSchema = z.object({
  playerId: z.coerce.number().int(),
  teamId: z.coerce.number().int(),
  minute: z.coerce.number().int().min(1).max(130).optional().nullable(),
  isFirstGoal: z.coerce.boolean().default(false),
  isOwnGoal: z.coerce.boolean().default(false),
  isPenalty: z.coerce.boolean().default(false),
});

const resultSchema = z.object({
  matchId: z.coerce.number().int(),
  homeScore: z.coerce.number().int().min(0).max(40),
  awayScore: z.coerce.number().int().min(0).max(40),
  status: z.enum(["scheduled", "live", "finished"]),
  wentToPens: z.coerce.boolean().default(false),
  homeScorePen: z.coerce.number().int().min(0).max(40).optional().nullable(),
  awayScorePen: z.coerce.number().int().min(0).max(40).optional().nullable(),
  winnerTeamId: z.coerce.number().int().optional().nullable(),
  scorers: z.array(scorerSchema).default([]),
});

export async function saveMatchResult(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireAdmin();
  // FormData carries scorers as repeated fields scorer[i].playerId etc. Keep it
  // simple: read a JSON string from a hidden input.
  const scorersRaw = formData.get("scorersJson");
  let scorers: unknown = [];
  try {
    scorers = scorersRaw ? JSON.parse(String(scorersRaw)) : [];
  } catch {
    scorers = [];
  }

  const parsed = resultSchema.safeParse({
    matchId: formData.get("matchId"),
    homeScore: formData.get("homeScore"),
    awayScore: formData.get("awayScore"),
    status: formData.get("status") ?? "finished",
    wentToPens: formData.get("wentToPens") === "on" || formData.get("wentToPens") === "true",
    homeScorePen: formData.get("homeScorePen") || null,
    awayScorePen: formData.get("awayScorePen") || null,
    winnerTeamId: formData.get("winnerTeamId") || null,
    scorers,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  // Compute first-goal flag from the lowest minute among non-own-goals.
  const validScorers = parsed.data.scorers.filter((s) => !s.isOwnGoal);
  if (validScorers.length > 0) {
    const minMinute = Math.min(
      ...validScorers.map((s) => (s.minute == null ? Number.POSITIVE_INFINITY : s.minute)),
    );
    parsed.data.scorers = parsed.data.scorers.map((s) => ({
      ...s,
      isFirstGoal: !s.isOwnGoal && s.minute === minMinute,
    }));
  }

  // When the match goes back to "programado", strip every result-related
  // field so the public views show dashes again instead of a stale 0-0.
  const reverting = parsed.data.status === "scheduled";

  await db.transaction(async (tx) => {
    await tx
      .update(matches)
      .set({
        homeScore: reverting ? null : parsed.data.homeScore,
        awayScore: reverting ? null : parsed.data.awayScore,
        status: parsed.data.status,
        wentToPens: reverting ? false : parsed.data.wentToPens,
        homeScorePen: reverting ? null : parsed.data.homeScorePen ?? null,
        awayScorePen: reverting ? null : parsed.data.awayScorePen ?? null,
        winnerTeamId: reverting ? null : parsed.data.winnerTeamId ?? null,
      })
      .where(eq(matches.id, parsed.data.matchId));

    await tx.delete(matchScorers).where(eq(matchScorers.matchId, parsed.data.matchId));
    if (!reverting && parsed.data.scorers.length > 0) {
      await tx.insert(matchScorers).values(
        parsed.data.scorers.map((s) => ({
          matchId: parsed.data.matchId,
          playerId: s.playerId,
          teamId: s.teamId,
          minute: s.minute ?? null,
          isFirstGoal: s.isFirstGoal,
          isOwnGoal: s.isOwnGoal,
          isPenalty: s.isPenalty,
        })),
      );
    }
  });

  await logAdminAction({
    adminId: me.id,
    action: "match.result.save",
    payload: { matchId: parsed.data.matchId, status: parsed.data.status },
  });

  // Always reconcile points so reverting wipes any stale ledger entries.
  await recomputeMatchScoringForAllUsers(parsed.data.matchId);

  revalidatePath(`/admin/partidos/${parsed.data.matchId}`);
  revalidatePath(`/partido/${parsed.data.matchId}`);
  revalidatePath("/admin/partidos");
  revalidatePath("/calendario");
  revalidatePath("/ranking");
  return { ok: true };
}
