import { asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagueMemberships, leagues, profiles } from "@/lib/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { Trophy } from "lucide-react";
import { CreateLeagueDialog } from "./create-league-dialog";
import { LeaguesView, type LeagueRow } from "./leagues-view";

export const metadata = { title: "Ligas · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  // Pública primero; el resto por createdAt ascendente.
  const allLeagues = await db
    .select({
      id: leagues.id,
      slug: leagues.slug,
      name: leagues.name,
      inviteToken: leagues.inviteToken,
      joinCode: leagues.joinCode,
      isPublic: leagues.isPublic,
      createdAt: leagues.createdAt,
      createdBy: leagues.createdBy,
      creatorEmail: profiles.email,
      creatorNickname: profiles.nickname,
    })
    .from(leagues)
    .leftJoin(profiles, eq(profiles.id, leagues.createdBy))
    .orderBy(desc(leagues.isPublic), asc(leagues.createdAt));

  const memberRows = await db
    .select({
      leagueId: leagueMemberships.leagueId,
      count: sql<number>`count(*)::int`,
    })
    .from(leagueMemberships)
    .groupBy(leagueMemberships.leagueId);
  const memberByLeague = new Map(memberRows.map((r) => [r.leagueId, r.count]));

  const enriched: LeagueRow[] = allLeagues.map((l) => ({
    id: l.id,
    slug: l.slug,
    name: l.name,
    inviteToken: l.inviteToken,
    joinCode: l.joinCode,
    isPublic: l.isPublic,
    createdAt: l.createdAt.toISOString(),
    creator:
      l.creatorEmail || l.creatorNickname
        ? {
            nickname: l.creatorNickname,
            email: l.creatorEmail ?? "",
          }
        : null,
    members: memberByLeague.get(l.id) ?? 0,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Ligas"
        description="Pública + privadas. Hasta 5 privadas por usuario."
        actions={<CreateLeagueDialog />}
      />

      {enriched.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="No hay ligas"
          description="Comprueba la BD."
        />
      ) : (
        <LeaguesView leagues={enriched} />
      )}
    </div>
  );
}
