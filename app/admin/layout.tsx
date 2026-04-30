import { requireAdmin } from "@/lib/auth/guards";
import { AppHeader } from "@/components/shell/header";
import { AdminSidebar } from "./admin-sidebar";

// Todas las páginas /admin requieren admin logueado y consumen datos en
// vivo (resultados, jugadores, jornadas…). No tiene sentido prerenderlas
// en build — además, intentarlo en Vercel da timeout porque las queries
// no terminan en 60s contra Supabase desde el build. Saltar la fase
// estática.
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const me = await requireAdmin();
  return (
    <div className="flex min-h-dvh">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader
          email={me.email}
          nickname={me.nickname}
          avatarUrl={me.avatarUrl}
          isAdmin
        />
        <main className="flex-1 px-4 pb-24 pt-6 lg:px-8 lg:pb-12">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
