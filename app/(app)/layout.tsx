import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { currentLeagueId, getMembershipsForUser } from "@/lib/leagues";
import { AppHeader } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileBottomNav } from "@/components/shell/mobile-nav";
import { DeadlineBanner } from "@/components/shell/deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  // Onboarding guard: si el usuario aún no tiene liga activa (cuenta nueva
  // sin invite cookie consumida), lo mandamos al onboarding antes de
  // cualquier renderizado del shell. /onboarding vive fuera de este layout.
  if (me.leagueId == null) {
    redirect("/onboarding");
  }
  const isAdmin = me.role === "admin";
  const cookieStore = await cookies();
  const sidebarCollapsed = cookieStore.get("sidebar_collapsed")?.value === "1";
  const currentView = await currentLeagueId(me);
  const [{ imminent, pendingCount }, memberships] = await Promise.all([
    loadDeadlineSummary(me.id, currentView ?? me.leagueId!),
    getMembershipsForUser(me.id),
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
          memberships={memberships}
          activeLeagueId={currentView}
        />
        <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileBottomNav isAdmin={isAdmin} myId={me.id} pendingCount={pendingCount} />
      </div>
    </div>
  );
}
