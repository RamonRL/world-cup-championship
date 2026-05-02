import { and, asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { players, predSpecial, specialPredictions, teams } from "@/lib/db/schema";
import { Sparkles } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { ScoringBox } from "@/components/brand/scoring-box";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { SPECIALS_FOOTNOTE, SPECIALS_SCORING } from "@/lib/scoring/copy";
import { SpecialsForm } from "./specials-form";

export const metadata = { title: "Predicciones especiales" };

export default async function PredictSpecialsPage() {
  const me = await requireUser();
  const leagueId = (await currentLeagueId(me))!;
  const [specials, mine, allPlayers, allTeams] = await Promise.all([
    db.select().from(specialPredictions).orderBy(asc(specialPredictions.orderIndex)),
    db
      .select()
      .from(predSpecial)
      .where(and(eq(predSpecial.userId, me.id), eq(predSpecial.leagueId, leagueId))),
    db.select().from(players).orderBy(asc(players.name)),
    db.select().from(teams).orderBy(asc(teams.name)),
  ]);
  const myByKey = new Map(mine.map((m) => [m.specialId, m]));

  if (specials.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categoría 6"
          title="Predicciones especiales"
          description="Balón de Oro, Guante de Oro, gol >6 en grupos…"
        />
        <ScoringBox sections={SPECIALS_SCORING} footnote={SPECIALS_FOOTNOTE} />
        <EmptyState
          icon={<Sparkles className="size-5" />}
          title="Sin predicciones especiales todavía"
          description="Si has corrido el seed, deberían aparecer las 7 por defecto. Comprueba con `pnpm db:seed`."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 6"
        title="Predicciones especiales"
        description="Una pregunta por especial. Cada una con su propio cierre. Puedes editar hasta el cierre individual."
      />
      <ScoringBox sections={SPECIALS_SCORING} footnote={SPECIALS_FOOTNOTE} />
      <SpecialsForm
        specials={specials.map((s) => ({
          id: s.id,
          key: s.key,
          question: s.question,
          type: s.type,
          optionsJson: s.optionsJson as unknown,
          pointsConfigJson: s.pointsConfigJson as unknown,
          closesAt: s.closesAt.toISOString(),
        }))}
        existing={Array.from(myByKey.entries()).map(([specialId, row]) => ({
          specialId,
          valueJson: row.valueJson as Record<string, unknown>,
        }))}
        players={allPlayers.map((p) => ({
          id: p.id,
          name: p.name,
          position: p.position,
          teamId: p.teamId,
        }))}
        teams={allTeams.map((t) => ({ id: t.id, code: t.code, name: t.name }))}
      />
    </div>
  );
}
