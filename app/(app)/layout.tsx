import { cookies } from "next/headers";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { AppHeader } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileBottomNav } from "@/components/shell/mobile-nav";
import { DeadlineBanner } from "@/components/shell/deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar_collapsed")?.value === "1";
  const [{ imminent, pendingCount }, currentView, leagueRows] = await Promise.all([
    loadDeadlineSummary(me.id),
    currentLeagueId(me),
    isAdmin
      ? db
          .select({ id: leagues.id, name: leagues.name, isPublic: leagues.isPublic })
          .from(leagues)
          .orderBy(asc(leagues.isPublic), asc(leagues.name))
      : Promise.resolve([]),
  ]);
  return (
    <div className="flex min-h-dvh">
      <Sidebar
        isAdmin={isAdmin}
        myId={me.id}
        pendingCount={pendingCount}
        defaultCollapsed={sidebarCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <DeadlineBanner deadline={imminent} />
        <AppHeader
          email={me.email}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          isAdmin={isAdmin}
          leagues={leagueRows}
          currentLeagueId={currentView}
        />
        <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileBottomNav isAdmin={isAdmin} myId={me.id} pendingCount={pendingCount} />
      </div>
    </div>
  );
}
