import { notFound } from "next/navigation";
import Link from "next/link";
import { and, eq, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagues, profiles } from "@/lib/db/schema";
import { Button } from "@/components/ui/button";
import { acceptInvite } from "@/lib/league-actions";
import { ArrowRight, Trophy, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InviteLandingPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const [league] = await db
    .select()
    .from(leagues)
    .where(and(eq(leagues.inviteToken, token), ne(leagues.isPublic, true)))
    .limit(1);
  if (!league) notFound();

  const [memberCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(profiles)
    .where(eq(profiles.leagueId, league.id));

  // Server action wrapper: aceptInvite hace su propio redirect si todo va
  // bien. Si devuelve estado "already_in_other" es porque el usuario ya
  // está en otra liga; mostramos el error vía un parámetro.
  async function accept() {
    "use server";
    const res = await acceptInvite(token);
    // Si llegamos aquí es porque acceptInvite no hizo redirect → caso de
    // error. Lanzamos un error para que el error boundary lo recoja.
    if (res.status === "already_in_other") {
      throw new Error(
        `Ya perteneces a otra liga. Pídele al admin que te mueva si quieres unirte a "${res.leagueName}".`,
      );
    }
  }

  return (
    <div className="relative grid min-h-dvh place-items-center px-6 py-12">
      <div className="halftone pointer-events-none absolute inset-0 opacity-[0.04]" aria-hidden />
      <div className="relative w-full max-w-md space-y-8 rounded-2xl border border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_4%,var(--color-surface))] p-8 shadow-[var(--shadow-elev-2)] sm:p-10">
        <header className="space-y-3 text-center">
          <span className="inline-flex size-12 place-items-center rounded-full bg-[var(--color-arena)] text-white shadow-[var(--shadow-arena)]">
            <Trophy className="size-5" />
          </span>
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-arena)]">
            Invitación a una liga privada
          </p>
          <h1 className="font-display text-4xl tracking-tight">{league.name}</h1>
          {league.description ? (
            <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
              {league.description}
            </p>
          ) : null}
        </header>

        <div className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5">
            <span className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
              <Users className="size-3.5" />
              Miembros
            </span>
            <span className="font-display tabular text-base">{memberCount?.count ?? 0}</span>
          </div>
          <p className="font-editorial text-xs italic leading-relaxed text-[var(--color-muted-foreground)]">
            Al aceptar verás solo a los participantes y al ranking de esta liga. El resto del
            Mundial 26 (calendario, partidos, jugadores) es el mismo que ve todo el mundo.
          </p>
        </div>

        <form action={accept}>
          <Button type="submit" size="lg" className="w-full">
            Aceptar invitación
            <ArrowRight />
          </Button>
        </form>

        <p className="text-center font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="underline">
            Inicia sesión
          </Link>{" "}
          y vuelve a este enlace.
        </p>
      </div>
    </div>
  );
}
