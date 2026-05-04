import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/guards";
import { currentLeagueId, getMembershipsForUser } from "@/lib/leagues";
import { AppHeader } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileBottomNav } from "@/components/shell/mobile-nav";
import { DeadlineBanner } from "@/components/shell/deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

/**
 * Layout PÚBLICO. Igual que (app)/layout.tsx pero sin requireUser():
 * pages dentro de (public) son indexables por Google. Si hay sesión,
 * conserva todo el shell autenticado (header con UserMenu, sidebar
 * completo, deadline banner, league switcher); si no, renderiza un
 * shell reducido con CTAs para entrar / crear quiniela.
 *
 * Las pages dentro deciden por sí mismas qué secciones mostrar a
 * visitantes vs. logueados (predicciones, ranking, etc. solo cuando
 * `me != null`).
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await getCurrentUser();
  const isAuthenticated = me != null;
  const isAdmin = me?.role === "admin";
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar_collapsed")?.value === "1";

  let activeLeagueId: number | null = null;
  let memberships: Awaited<ReturnType<typeof getMembershipsForUser>> = [];
  let imminent: Awaited<ReturnType<typeof loadDeadlineSummary>>["imminent"] = null;
  let pendingCount = 0;
  if (me) {
    activeLeagueId = await currentLeagueId(me);
    const [{ imminent: imm, pendingCount: pc }, ms] = await Promise.all([
      loadDeadlineSummary(me.id, activeLeagueId ?? me.leagueId!),
      getMembershipsForUser(me.id),
    ]);
    imminent = imm;
    pendingCount = pc;
    memberships = ms;
  }

  const activeMembership = memberships.find((m) => m.id === activeLeagueId);
  const showMyLeague = activeMembership ? !activeMembership.isPublic : false;

  return (
    <div className="flex min-h-dvh">
      <Sidebar
        isAdmin={isAdmin}
        myId={me?.id ?? ""}
        pendingCount={pendingCount}
        defaultCollapsed={sidebarCollapsed}
        showMyLeague={showMyLeague}
        isAuthenticated={isAuthenticated}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        {isAuthenticated ? <DeadlineBanner deadline={imminent} /> : null}
        <AppHeader
          email={me?.email ?? null}
          nickname={me?.nickname ?? null}
          avatarUrl={me?.avatarUrl ?? null}
          isAdmin={isAdmin}
          memberships={memberships}
          activeLeagueId={activeLeagueId}
        />
        <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileBottomNav
          isAdmin={isAdmin}
          myId={me?.id ?? ""}
          pendingCount={pendingCount}
          showMyLeague={showMyLeague}
          isAuthenticated={isAuthenticated}
        />
      </div>
    </div>
  );
}
