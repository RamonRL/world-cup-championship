import { cookies } from "next/headers";
import { eq, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues, profiles } from "@/lib/db/schema";
import type { CurrentUser } from "@/lib/auth/guards";

const ADMIN_VIEW_COOKIE = "admin_league_view";
export const PENDING_INVITE_COOKIE = "pending_league_token";
export const PUBLIC_LEAGUE_SLUG = "liga-principal";

/** Cached lookup of the public main league (Liga principal). */
let publicLeagueCache: { id: number; slug: string } | null = null;
export async function getPublicLeague(): Promise<{ id: number; slug: string } | null> {
  if (publicLeagueCache) return publicLeagueCache;
  const [row] = await db
    .select({ id: leagues.id, slug: leagues.slug })
    .from(leagues)
    .where(eq(leagues.slug, PUBLIC_LEAGUE_SLUG))
    .limit(1);
  if (!row) return null;
  publicLeagueCache = row;
  return row;
}

/**
 * Liga que el usuario "ve" en la app:
 *  - admin: respeta una cookie `admin_league_view` si existe (selector del
 *    header), si no devuelve la liga principal. Permite que el admin
 *    explore cada liga sin tener que estar dentro.
 *  - resto: la liga registrada en su perfil; fallback a la principal por
 *    defensa, aunque no debería pasar tras la migración.
 */
export async function currentLeagueId(me: CurrentUser): Promise<number | null> {
  if (me.role === "admin") {
    const cookieStore = await cookies();
    const override = cookieStore.get(ADMIN_VIEW_COOKIE)?.value;
    const overrideId = override ? Number(override) : NaN;
    if (Number.isFinite(overrideId) && overrideId > 0) return overrideId;
    const pub = await getPublicLeague();
    return pub?.id ?? null;
  }
  if (me.leagueId != null) return me.leagueId;
  const pub = await getPublicLeague();
  return pub?.id ?? null;
}

export const ADMIN_LEAGUE_VIEW_COOKIE = ADMIN_VIEW_COOKIE;

/**
 * Filtro Drizzle reutilizable: el usuario pertenece a la liga `leagueId`
 * O tiene rol admin. Los admins son "globales" — aparecen en el ranking,
 * podio, comparar y predicciones reveladas de todas las ligas. Sus picks
 * son los mismos para todas (no se duplican), simplemente entran en cada
 * agregación.
 *
 * Si `leagueId` es null, devolvemos undefined (sin filtro) y la query
 * carga todos los profiles — es el caso del admin sin liga pública
 * seedeada, defensa-en-profundidad.
 */
export function inLeagueFilter(leagueId: number | null): SQL | undefined {
  if (leagueId == null) return undefined;
  return or(eq(profiles.leagueId, leagueId), eq(profiles.role, "admin"));
}
