import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues, profiles } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shell/page-header";
import { EmptyState } from "@/components/shell/empty-state";
import { DeleteButton } from "@/components/admin/delete-button";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { CreateLeagueDialog } from "./create-league-dialog";
import { InviteLinkCopy } from "./invite-link-copy";
import { deleteLeague } from "@/lib/league-actions";

export const metadata = { title: "Ligas · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLeaguesPage() {
  const allLeagues = await db.select().from(leagues).orderBy(asc(leagues.isPublic), asc(leagues.createdAt));

  // Member counts per league in a single query.
  const memberRows = await db
    .select({ leagueId: profiles.leagueId, count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(sql`${profiles.leagueId} is not null`)
    .groupBy(profiles.leagueId);
  const memberByLeague = new Map(memberRows.map((r) => [r.leagueId ?? 0, r.count]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Ligas"
        description="Crea ligas privadas y reparte el invite link a los participantes. Cada cuenta queda atada a una sola liga; admin (tú) puede ver cualquiera."
        actions={<CreateLeagueDialog />}
      />

      {allLeagues.length === 0 ? (
        <EmptyState
          icon={<Trophy className="size-5" />}
          title="No hay ligas"
          description="La migración debería haber creado la liga principal — comprueba la BD."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {allLeagues.map((league) => {
            const members = memberByLeague.get(league.id) ?? 0;
            return (
              <article
                key={league.id}
                className={`rounded-xl border bg-[var(--color-surface)] p-5 ${
                  league.isPublic
                    ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))]"
                    : "border-[var(--color-border)]"
                }`}
              >
                <header className="flex items-start justify-between gap-3 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {league.isPublic ? (
                        <Badge variant="success" className="text-[0.55rem]">
                          Pública
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[0.55rem]">
                          Privada
                        </Badge>
                      )}
                      <span className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                        {league.slug}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl tracking-tight">{league.name}</h2>
                    {league.description ? (
                      <p className="font-editorial text-xs italic text-[var(--color-muted-foreground)]">
                        {league.description}
                      </p>
                    ) : null}
                  </div>
                  {league.isPublic ? null : (
                    <DeleteButton
                      action={deleteLeague}
                      id={league.id}
                      confirmMessage={`¿Eliminar "${league.name}"? Sus ${members} miembros se moverán a la liga principal.`}
                    />
                  )}
                </header>

                <div className="space-y-2 border-t border-[var(--color-border)] pt-3">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
                      <Users className="size-3.5" />
                      Miembros
                    </span>
                    <span className="font-display tabular text-base">{members}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-muted-foreground)]">
                    <span>Creada {formatDateTime(league.createdAt, { day: "2-digit", month: "short" })}</span>
                  </div>
                  {!league.isPublic ? (
                    <InviteLinkCopy leagueId={league.id} token={league.inviteToken} />
                  ) : null}
                  <Link
                    href={`/admin/ligas/${league.id}`}
                    className="mt-1 flex items-center justify-between gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-xs font-medium transition hover:border-[var(--color-arena)]/40"
                  >
                    Gestionar miembros
                    <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
