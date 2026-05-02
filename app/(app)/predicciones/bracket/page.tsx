import { and, asc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { predBracketSlot, teams } from "@/lib/db/schema";
import { Swords } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { ScoringBox } from "@/components/brand/scoring-box";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { formatDateTime } from "@/lib/utils";
import { getBracketStatus, getQualifiedTeamIds } from "@/lib/bracket-state";
import { BRACKET_FOOTNOTE, BRACKET_SCORING } from "@/lib/scoring/copy";
import { BracketBuilder } from "./bracket-builder";

export const metadata = { title: "Bracket · Predicciones" };

export default async function PredictBracketPage() {
  const me = await requireUser();
  const status = await getBracketStatus();

  if (status.state === "waiting") {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categoría 2"
          title="Bracket eliminatorio"
          description="Se desbloquea al cerrar la fase de grupos."
        />
        <ScoringBox sections={BRACKET_SCORING} footnote={BRACKET_FOOTNOTE} />
        <EmptyState
          icon={<Swords className="size-5" />}
          title="Aún no abierto"
          description="Se abrirá al cierre de los grupos. Plazo hasta el primer dieciseisavos."
        />
      </div>
    );
  }

  const qualifiedIds = await getQualifiedTeamIds();
  const qualifiedTeams =
    qualifiedIds.length > 0
      ? await db.select().from(teams).where(inArray(teams.id, qualifiedIds))
      : [];

  const leagueId = (await currentLeagueId(me))!;
  const mine = await db
    .select()
    .from(predBracketSlot)
    .where(
      and(
        eq(predBracketSlot.userId, me.id),
        eq(predBracketSlot.leagueId, leagueId),
      ),
    );

  // Filter previous picks to only those still in the qualified pool (just in
  // case the standings shifted between submissions).
  const qualifiedSet = new Set(qualifiedIds);
  const inPool = (id: number | null): id is number => id != null && qualifiedSet.has(id);

  const r16 = mine
    .filter((m) => m.stage === "r16")
    .map((m) => m.predictedTeamId)
    .filter(inPool);
  const qf = mine
    .filter((m) => m.stage === "qf")
    .map((m) => m.predictedTeamId)
    .filter(inPool);
  const sf = mine
    .filter((m) => m.stage === "sf")
    .map((m) => m.predictedTeamId)
    .filter(inPool);
  const finalists = mine
    .filter((m) => m.stage === "final" && m.slotPosition !== 0)
    .map((m) => m.predictedTeamId)
    .filter(inPool);
  const champion = mine.find(
    (m) => m.stage === "final" && m.slotPosition === 0,
  )?.predictedTeamId;
  const championTeamId = inPool(champion ?? null) ? champion! : null;

  const sortedTeams = [...qualifiedTeams].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 2"
        title="Bracket eliminatorio"
        description={
          status.state === "open"
            ? `Selecciona quién avanza en cada ronda hasta el campeón. Cierre: ${
                status.closesAt ? formatDateTime(status.closesAt) : "primer partido de R32"
              }.`
            : "Bracket cerrado: los dieciseisavos ya arrancaron."
        }
      />
      <ScoringBox sections={BRACKET_SCORING} footnote={BRACKET_FOOTNOTE} />
      <BracketBuilder
        open={status.state === "open"}
        teams={sortedTeams.map((t) => ({
          id: t.id,
          code: t.code,
          name: t.name,
          flagUrl: t.flagUrl,
        }))}
        initial={{ r16, qf, sf, finalists, championTeamId }}
      />
    </div>
  );
}
