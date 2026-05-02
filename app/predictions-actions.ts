"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { importPredictionsBetweenLeagues } from "@/lib/import-predictions";

export type ImportFormState = {
  ok: boolean;
  error?: string;
  message?: string;
};

const schema = z.object({ sourceLeagueId: z.coerce.number().int() });

export async function importPredictionsAction(
  _prev: ImportFormState,
  formData: FormData,
): Promise<ImportFormState> {
  const me = await requireUser();
  const targetLeagueId = await currentLeagueId(me);
  if (targetLeagueId == null) {
    return { ok: false, error: "Sin liga activa." };
  }
  const parsed = schema.safeParse({
    sourceLeagueId: formData.get("sourceLeagueId"),
  });
  if (!parsed.success) {
    return { ok: false, error: "Liga origen inválida." };
  }
  if (parsed.data.sourceLeagueId === targetLeagueId) {
    return { ok: false, error: "Origen y destino no pueden ser la misma liga." };
  }

  try {
    const stats = await importPredictionsBetweenLeagues({
      userId: me.id,
      sourceLeagueId: parsed.data.sourceLeagueId,
      targetLeagueId,
    });
    const total =
      stats.groupRankings +
      stats.bracket +
      stats.topScorer +
      stats.matchResults +
      stats.matchScorers +
      stats.specials;
    revalidatePath("/", "layout");
    return {
      ok: true,
      message: `Importadas ${total} picks (${stats.groupRankings} grupos · ${stats.bracket} bracket · ${stats.matchResults} marcadores · ${stats.matchScorers} goleadores · ${stats.topScorer} bota de oro · ${stats.specials} especiales).`,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Error al importar.",
    };
  }
}
