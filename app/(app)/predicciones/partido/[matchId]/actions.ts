"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db";
import { matches, players, predMatchScorer } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";

export type FormState = { ok: boolean; error?: string };

const schema = z.object({
  matchId: z.coerce.number().int(),
  playerId: z.coerce.number().int(),
});

export async function saveMatchScorerPrediction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const me = await requireUser();
  const parsed = schema.safeParse({
    matchId: formData.get("matchId"),
    playerId: formData.get("playerId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Selecciona un jugador para guardar." };
  }

  const [match] = await db
    .select()
    .from(matches)
    .where(eq(matches.id, parsed.data.matchId))
    .limit(1);
  if (!match) return { ok: false, error: "Partido no encontrado." };
  if (new Date(match.scheduledAt).getTime() <= Date.now()) {
    return { ok: false, error: "El partido ya empezó. La predicción está cerrada." };
  }

  // Sanity: the player must belong to one of the two teams in the match.
  const [player] = await db
    .select()
    .from(players)
    .where(eq(players.id, parsed.data.playerId))
    .limit(1);
  if (!player) return { ok: false, error: "Jugador no encontrado." };
  if (player.teamId !== match.homeTeamId && player.teamId !== match.awayTeamId) {
    return { ok: false, error: "Ese jugador no juega este partido." };
  }

  await db
    .insert(predMatchScorer)
    .values({
      userId: me.id,
      matchId: parsed.data.matchId,
      playerId: parsed.data.playerId,
      submittedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [predMatchScorer.userId, predMatchScorer.matchId],
      set: {
        playerId: parsed.data.playerId,
        submittedAt: new Date(),
      },
    });

  revalidatePath(`/predicciones/partido/${parsed.data.matchId}`);
  revalidatePath("/predicciones/partido");
  revalidatePath("/predicciones");
  return { ok: true };
}
