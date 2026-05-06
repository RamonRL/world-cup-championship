import Link from "next/link";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { predBracketSlot, teams } from "@/lib/db/schema";
import { Eye, Swords } from "lucide-react";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { ScoringBox } from "@/components/brand/scoring-box";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { formatDateTime } from "@/lib/utils";
import { getBracketStatus, getQualifiedTeamIds } from "@/lib/bracket-state";
import { BRACKET_FOOTNOTE, BRACKET_SCORING } from "@/lib/scoring/copy";
import { BracketBuilder } from "./bracket-builder";

export const metadata = { title: "Bracket · Predicciones" };

export default async function PredictBracketPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  const me = await requireUser();
  const status = await getBracketStatus();
  const params = await searchParams;
  const previewRequested = params.preview === "1" && me.role === "admin";

  if (status.state === "waiting" && !previewRequested) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Categoría 4"
          title="Bracket eliminatorio"
          description="Se desbloquea al cerrar la fase de grupos."
        />
        <ScoringBox sections={BRACKET_SCORING} footnote={BRACKET_FOOTNOTE} />
        <EmptyState
          icon={<Swords className="size-5" />}
          title="Aún no abierto"
          description="Se abrirá al cierre de los grupos. Plazo hasta el primer dieciseisavos."
          action={
            me.role === "admin" ? (
              <Button asChild variant="outline" size="sm">
                <Link href="/predicciones/bracket?preview=1">
                  <Eye />
                  Vista previa admin
                </Link>
              </Button>
            ) : undefined
          }
        />
      </div>
    );
  }

  const qualifiedIds = await getQualifiedTeamIds();
  // En modo "previa admin" los grupos aún no han cerrado, así que no hay
  // 32 clasificados — usamos todas las selecciones para que la UI tenga
  // contenido con el que jugar.
  const qualifiedTeams =
    previewRequested && qualifiedIds.length === 0
      ? await db.select().from(teams)
      : qualifiedIds.length > 0
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
  // case the standings shifted between submissions). En previa admin el pool
  // son todas las selecciones, así que aceptamos cualquier id existente.
  const poolSet = new Set(qualifiedTeams.map((t) => t.id));
  const inPool = (id: number | null): id is number => id != null && poolSet.has(id);

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

  const description = previewRequested
    ? "Vista previa admin: así verán los participantes el bracket cuando se abra."
    : status.state === "open"
      ? `Selecciona quién avanza en cada ronda hasta el campeón. Cierre: ${
          status.closesAt ? formatDateTime(status.closesAt) : "primer partido de R32"
        }.`
      : "Bracket cerrado: los dieciseisavos ya arrancaron.";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Categoría 4"
        title="Bracket eliminatorio"
        description={description}
      />
      <ScoringBox sections={BRACKET_SCORING} footnote={BRACKET_FOOTNOTE} />
      <BracketBuilder
        open={status.state === "open"}
        preview={previewRequested}
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
