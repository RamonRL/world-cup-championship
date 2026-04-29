/**
 * Reglas de visibilidad de las predicciones de los demás. Las predicciones
 * son privadas hasta que el partido / ronda al que se refieren empieza, momento
 * en el que pasan a ser públicas (usuario decidido en el plan).
 */

import type { matchStage } from "@/lib/db/schema";

type Stage = (typeof matchStage.enumValues)[number];

export type PredictionVisibilityContext =
  | { kind: "match"; scheduledAt: Date }
  | { kind: "group_ranking"; firstMatchAt: Date | null }
  | { kind: "bracket_stage"; stage: Stage; firstMatchOfStageAt: Date | null }
  | { kind: "tournament_pre"; closesAt: Date };

export function isPredictionPublic(ctx: PredictionVisibilityContext, now: Date = new Date()) {
  switch (ctx.kind) {
    case "match":
      return now >= ctx.scheduledAt;
    case "group_ranking":
      return ctx.firstMatchAt ? now >= ctx.firstMatchAt : false;
    case "bracket_stage":
      return ctx.firstMatchOfStageAt ? now >= ctx.firstMatchOfStageAt : false;
    case "tournament_pre":
      return now >= ctx.closesAt;
  }
}

/** Whether the user can still edit (submit/replace) a prediction. */
export function isPredictionOpen(deadline: Date | null, now: Date = new Date()) {
  if (!deadline) return true;
  return now < deadline;
}
