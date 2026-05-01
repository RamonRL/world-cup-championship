import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues } from "@/lib/db/schema";
import { requireAdmin } from "@/lib/auth/guards";
import { currentLeagueId } from "@/lib/leagues";
import { AppHeader } from "@/components/shell/header";
import { AdminMobileNav, AdminSidebar } from "./admin-sidebar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  const [currentView, leagueRows] = await Promise.all([
    currentLeagueId(me),
    db
      .select({ id: leagues.id, name: leagues.name, isPublic: leagues.isPublic })
      .from(leagues)
      .orderBy(asc(leagues.isPublic), asc(leagues.name)),
  ]);
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          email={me.email}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          isAdmin
          leagues={leagueRows}
          currentLeagueId={currentView}
        />
        <AdminMobileNav />
        <main className="flex-1 px-4 pb-[calc(env(safe-area-inset-bottom)+6rem)] pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
