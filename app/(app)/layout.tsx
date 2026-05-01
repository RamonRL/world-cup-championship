import { requireUser } from "@/lib/auth/guards";
import { AppHeader } from "@/components/shell/header";
import { Sidebar } from "@/components/shell/sidebar";
import { MobileBottomNav } from "@/components/shell/mobile-nav";
import { DeadlineBanner } from "@/components/shell/deadline-banner";
import { loadDeadlineSummary } from "@/lib/deadlines";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const me = await requireUser();
  const isAdmin = me.role === "admin";
  const { imminent, pendingCount } = await loadDeadlineSummary(me.id);
  return (
    <div className="flex min-h-dvh">
      <Sidebar isAdmin={isAdmin} pendingCount={pendingCount} />
      <div className="flex min-w-0 flex-1 flex-col">
        <DeadlineBanner deadline={imminent} />
        <AppHeader
          email={me.email}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          isAdmin={isAdmin}
        />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
        <MobileBottomNav isAdmin={isAdmin} pendingCount={pendingCount} />
      </div>
    </div>
  );
}
