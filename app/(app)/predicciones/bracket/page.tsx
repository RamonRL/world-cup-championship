import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { predBracketSlot, teams } from "@/lib/db/schema";
import { Swords } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/utils";
import { BracketBuilder } from "./bracket-builder";

export const metadata = { title: "Bracket · Predicciones" };

const KICKOFF = new Date(
  process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z",
);

export default async function PredictBracketPage() {
  const me = await requireUser();
  const [allTeams, mine] = await Promise.all([
    db.select().from(teams).orderBy(asc(teams.name)),
    db.select().from(predBracketSlot).where(eq(predBracketSlot.userId, me.id)),
  ]);

  if (allTeams.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categoría 2"
          title="Bracket eliminatorio"
          description="2 → 4 → 7 → 10 → 20 puntos por equipo correcto en cada ronda."
        />
        <EmptyState
          icon={<Swords className="size-5" />}
          title="No hay selecciones cargadas"
          description="El admin debe crear las 48 selecciones antes de que puedas predecir el bracket."
        />
      </div>
    );
  }

  const r16 = mine.filter((m) => m.stage === "r16").map((m) => m.predictedTeamId).filter((x): x is number => x != null);
  const qf = mine.filter((m) => m.stage === "qf").map((m) => m.predictedTeamId).filter((x): x is number => x != null);
  const sf = mine.filter((m) => m.stage === "sf").map((m) => m.predictedTeamId).filter((x): x is number => x != null);
  const finalists = mine
    .filter((m) => m.stage === "final" && m.slotPosition !== 0)
    .map((m) => m.predictedTeamId)
    .filter((x): x is number => x != null);
  const champion = mine.find((m) => m.stage === "final" && m.slotPosition === 0)?.predictedTeamId ?? null;

  const open = KICKOFF.getTime() > Date.now();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 2"
        title="Bracket eliminatorio"
        description={
          open
            ? `Selecciona los equipos que avanzan en cada ronda. Cierra ${formatDateTime(KICKOFF)}.`
            : "Bracket cerrado."
        }
      />
      <BracketBuilder
        open={open}
        teams={allTeams.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          flagUrl: t.flagUrl,
        }))}
        initial={{ r16, qf, sf, finalists, championTeamId: champion }}
      />
    </div>
  );
}
