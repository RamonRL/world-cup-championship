"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { leagueMemberships, profiles } from "@/lib/db/schema";
import { requireUser } from "@/lib/auth/guards";
import { getPublicLeague, isMemberOf } from "@/lib/leagues";

/**
 * Onboarding: el usuario elige "Quiniela Pública" como liga activa.
 * La membresía pública es implícita y siempre está, así que aquí basta
 * con asegurar la fila por si alguna migración hueco la dejó fuera, y
 * setear `profiles.leagueId` a la pública.
 */
export async function chooseActivePublic() {
  const me = await requireUser();
  const pub = await getPublicLeague();
  if (!pub) {
    throw new Error("La liga pública no existe en la BD.");
  }
  const already = await isMemberOf(me.id, pub.id);
  if (!already) {
    await db
      .insert(leagueMemberships)
      .values({ userId: me.id, leagueId: pub.id })
      .onConflictDoNothing();
  }
  await db.update(profiles).set({ leagueId: pub.id }).where(eq(profiles.id, me.id));
  revalidatePath("/", "layout");
  redirect("/dashboard");
}
