import { TeamFlag } from "@/components/brand/team-flag";
import Link from "next/link";
import { asc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  groups,
  matches,
  players,
  predBracketSlot,
  predGroupRanking,
  predTournamentTopScorer,
  profiles,
  teams,
} from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth/guards";
import { formatDateTime, initials } from "@/lib/utils";
import { getBracketStatus } from "@/lib/bracket-state";
import { OpponentPicker } from "./opponent-picker";

export const metadata = { title: "Comparar predicciones" };

const KICKOFF = new Date(
  process.env.NEXT_PUBLIC_TOURNAMENT_KICKOFF_AT ?? "2026-06-11T20:00:00Z",
);

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ vs?: string }>;
}) {
  const me = await requireUser();
  const params = await searchParams;
  const vsId = params.vs ?? null;
  const allUsers = await db
    .select()
    .from(profiles)
    .where(ne(profiles.id, me.id))
    .orderBy(asc(profiles.email));

  if (allUsers.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Cara a cara"
          title="Compara predicciones"
          description="Necesitas a otro participante registrado para comparar."
        />
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Aún sólo estás tú"
          description="Comparte el enlace con tus amigos para que se registren."
        />
      </div>
    );
  }

  const opponent = vsId ? allUsers.find((u) => u.id === vsId) ?? null : allUsers[0];

  // Group rankings + Bota de Oro se hacen públicos al kickoff del torneo.
  // Bracket sólo cuando arranca R32.
  const tournamentPredsPublic = KICKOFF.getTime() <= Date.now();
  const bracketStatus = await getBracketStatus();
  const bracketPublic = bracketStatus.state === "closed";

  const [myGroups, opponentGroups, allGroups, allTeams, allPlayers, myChamp, oppChamp, myTop, oppTop] = await Promise.all([
    db.select().from(predGroupRanking).where(eq(predGroupRanking.userId, me.id)),
    opponent
      ? db.select().from(predGroupRanking).where(eq(predGroupRanking.userId, opponent.id))
      : Promise.resolve([]),
    db.select().from(groups).orderBy(asc(groups.code)),
    db.select().from(teams),
    db.select().from(players),
    db
      .select()
      .from(predBracketSlot)
      .where(eq(predBracketSlot.userId, me.id)),
    opponent
      ? db
          .select()
          .from(predBracketSlot)
          .where(eq(predBracketSlot.userId, opponent.id))
      : Promise.resolve([]),
    db
      .select()
      .from(predTournamentTopScorer)
      .where(eq(predTournamentTopScorer.userId, me.id))
      .limit(1),
    opponent
      ? db
          .select()
          .from(predTournamentTopScorer)
          .where(eq(predTournamentTopScorer.userId, opponent.id))
          .limit(1)
      : Promise.resolve([]),
  ]);
  void or; void inArray; void matches;

  const teamById = new Map(allTeams.map((t) => [t.id, t]));
  const playerById = new Map(allPlayers.map((p) => [p.id, p]));

  function findGroupPred(rows: typeof myGroups, groupId: number) {
    return rows.find((r) => r.groupId === groupId) ?? null;
  }

  const myChampionTeamId = myChamp.find((b) => b.stage === "final" && b.slotPosition === 0)
    ?.predictedTeamId;
  const oppChampionTeamId = oppChamp.find((b) => b.stage === "final" && b.slotPosition === 0)
    ?.predictedTeamId;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Cara a cara"
        title="Compara predicciones"
        description="Mostramos las que ya son públicas: posiciones de grupo, bracket y Bota de Oro a partir del kickoff del torneo."
      />
      <OpponentPicker
        currentUserId={me.id}
        currentOpponentId={opponent?.id ?? null}
        opponents={allUsers.map((u) => ({
          id: u.id,
          email: u.email,
          nickname: u.nickname,
          avatarUrl: u.avatarUrl,
        }))}
      />

      {!opponent ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="Selecciona un oponente"
          description="Elige un participante en el desplegable para empezar."
        />
      ) : !tournamentPredsPublic ? (
        <Card>
          <CardHeader>
            <CardTitle>Aún privadas</CardTitle>
            <CardDescription>
              Las predicciones de grupos y Bota de Oro se hacen públicas el{" "}
              {formatDateTime(KICKOFF)}. El bracket eliminatorio se publicará al
              empezar la primera ronda de dieciseisavos.
            </CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <>
          <section className="space-y-3">
            <h2 className="font-display text-2xl">Posiciones por grupo</h2>
            <div className="grid gap-3 lg:grid-cols-2">
              {allGroups.map((g) => {
                const m = findGroupPred(myGroups, g.id);
                const o = findGroupPred(opponentGroups, g.id);
                if (!m && !o) return null;
                return (
                  <Card key={g.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{g.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <ParticipantColumn
                          title="Tú"
                          rows={[m?.pos1TeamId, m?.pos2TeamId, m?.pos3TeamId, m?.pos4TeamId].map(
                            (id) => teamById.get(id ?? -1) ?? null,
                          )}
                        />
                        <ParticipantColumn
                          title={opponent.nickname || opponent.email.split("@")[0]}
                          rows={[o?.pos1TeamId, o?.pos2TeamId, o?.pos3TeamId, o?.pos4TeamId].map(
                            (id) => teamById.get(id ?? -1) ?? null,
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-2xl">Bota de Oro & Campeón</h2>
            {!bracketPublic ? (
              <p className="text-xs text-[var(--color-muted-foreground)]">
                El campeón se desvelará cuando empiecen los dieciseisavos.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Tú</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Pair
                    label="Bota de Oro"
                    value={myTop[0] ? playerById.get(myTop[0].playerId ?? -1)?.name ?? "—" : "—"}
                  />
                  <Pair
                    label="Campeón"
                    value={
                      bracketPublic
                        ? teamById.get(myChampionTeamId ?? -1)?.name ?? "—"
                        : "(privado hasta R32)"
                    }
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    {opponent.nickname || opponent.email.split("@")[0]}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Pair
                    label="Bota de Oro"
                    value={
                      oppTop[0] ? playerById.get(oppTop[0].playerId ?? -1)?.name ?? "—" : "—"
                    }
                  />
                  <Pair
                    label="Campeón"
                    value={
                      bracketPublic
                        ? teamById.get(oppChampionTeamId ?? -1)?.name ?? "—"
                        : "(privado hasta R32)"
                    }
                  />
                </CardContent>
              </Card>
            </div>
          </section>
        </>
      )}

      <p className="text-xs text-[var(--color-muted-foreground)]">
        Tip: ve también al{" "}
        <Link href="/ranking" className="underline">
          ranking
        </Link>{" "}
        para ver puntos vs tus amigos.
      </p>
    </div>
  );
}

function ParticipantColumn({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ name: string; code: string; flagUrl: string | null } | null>;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {title}
      </p>
      {rows.map((t, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="font-mono text-xs text-[var(--color-muted-foreground)]">
            {i + 1}º
          </span>
          {t ? (
            <>
              <TeamFlag code={t.code} size={16} />
              <span className="truncate">{t.name}</span>
            </>
          ) : (
            <span className="text-[var(--color-muted-foreground)]">—</span>
          )}
        </div>
      ))}
    </div>
  );
}

function Pair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-dashed border-[var(--color-border)] pb-1.5 last:border-b-0">
      <span className="text-xs uppercase tracking-wider text-[var(--color-muted-foreground)]">
        {label}
      </span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function _UserBadge({
  user,
}: {
  user: { email: string; nickname: string | null; avatarUrl: string | null };
}) {
  const display = user.nickname || user.email.split("@")[0];
  return (
    <div className="flex items-center gap-2">
      <Avatar className="size-6">
        {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
        <AvatarFallback className="text-[0.6rem]">{initials(display)}</AvatarFallback>
      </Avatar>
      <span className="text-sm font-medium">{display}</span>
      <Badge variant="outline" className="text-[0.6rem]">{user.email}</Badge>
    </div>
  );
}
