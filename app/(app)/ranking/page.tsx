import { ListOrdered } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { pointsLedger, profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { compareForRanking } from "@/lib/scoring/tiebreaker";
import { requireUser } from "@/lib/auth/guards";
import { initials } from "@/lib/utils";

export const metadata = { title: "Ranking" };

const KNOCKOUT_SOURCES = [
  "bracket_slot",
  "knockout_qualifier",
  "knockout_pens_bonus",
  "knockout_score_90",
] as const;

export default async function RankingPage() {
  const me = await requireUser();
  const allUsers = await db.select().from(profiles);
  const ledger = await db.select().from(pointsLedger);

  const championPredId = await db.execute<{ user_id: string; team_id: number }>(sql`
    SELECT user_id, predicted_team_id AS team_id
    FROM pred_bracket_slot
    WHERE stage = 'final' AND slot_position = 0
  `);
  const championByUser = new Map<string, number | null>();
  for (const row of championPredId as unknown as { user_id: string; team_id: number }[]) {
    championByUser.set(row.user_id, row.team_id);
  }
  const championTrue = await db.execute<{ winner_team_id: number | null }>(sql`
    SELECT winner_team_id FROM matches WHERE stage = 'final' ORDER BY scheduled_at DESC LIMIT 1
  `);
  const officialChampion = ((championTrue as unknown as { winner_team_id: number | null }[])[0])
    ?.winner_team_id ?? null;

  const stats = new Map<
    string,
    { totalPoints: number; exactScoresCount: number; knockoutPoints: number; championCorrect: boolean }
  >();
  for (const u of allUsers) {
    stats.set(u.id, {
      totalPoints: 0,
      exactScoresCount: 0,
      knockoutPoints: 0,
      championCorrect:
        officialChampion != null && championByUser.get(u.id) === officialChampion,
    });
  }
  for (const e of ledger) {
    const s = stats.get(e.userId);
    if (!s) continue;
    s.totalPoints += e.points;
    if (e.source === "match_exact_score" || e.source === "knockout_score_90") {
      s.exactScoresCount += 1;
    }
    if ((KNOCKOUT_SOURCES as readonly string[]).includes(e.source)) {
      s.knockoutPoints += e.points;
    }
  }

  const ranked = allUsers
    .map((u) => ({ user: u, ...(stats.get(u.id) ?? { totalPoints: 0, exactScoresCount: 0, knockoutPoints: 0, championCorrect: false }) }))
    .sort((a, b) =>
      compareForRanking(
        { userId: a.user.id, ...a },
        { userId: b.user.id, ...b },
      ),
    );

  if (ranked.length === 0 || ranked.every((r) => r.totalPoints === 0)) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Quiniela"
          title="Clasificación general"
          description="El ranking se actualiza automáticamente cuando el admin guarda resultados."
        />
        <EmptyState
          icon={<ListOrdered className="size-5" />}
          title="Sin puntos todavía"
          description="Cuando se cargue el primer resultado del torneo, el ranking arrancará."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Quiniela"
        title="Clasificación general"
        description="Empates: marcadores exactos · puntos en eliminatorias · campeón acertado."
      />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Participante</TableHead>
              <TableHead className="w-24 text-right">Puntos</TableHead>
              <TableHead className="hidden w-28 text-right sm:table-cell">Exactos</TableHead>
              <TableHead className="hidden w-28 text-right sm:table-cell">Eliminatorias</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map((r, i) => {
              const isMe = r.user.id === me.id;
              const display = r.user.nickname || r.user.email.split("@")[0];
              return (
                <TableRow key={r.user.id} data-state={isMe ? "selected" : undefined}>
                  <TableCell className="font-display text-lg">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        {r.user.avatarUrl ? <AvatarImage src={r.user.avatarUrl} alt="" /> : null}
                        <AvatarFallback>{initials(display)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{display}</p>
                        {isMe ? (
                          <Badge variant="success" className="mt-0.5 text-[0.6rem]">
                            Tú
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-display text-xl tabular-nums">
                    {r.totalPoints}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {r.exactScoresCount}
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {r.knockoutPoints}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
