import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, teams } from "@/lib/db/schema";
import { PageHeader } from "@/components/shell/page-header";
import { TeamsTable } from "./teams-table";

export const metadata = { title: "Selecciones · Admin" };
export const dynamic = "force-dynamic";

export default async function AdminTeamsPage() {
  const [allTeams, allGroups] = await Promise.all([
    db.select().from(teams).orderBy(asc(teams.name)),
    db.select().from(groups).orderBy(asc(groups.code)),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Selecciones"
        description="Las 48 selecciones del Mundial. Sube una bandera para cada una; te recomendamos PNG cuadrado (256×256 o 512×512) para que se vea bien en bracket y rankings."
      />
      <TeamsTable teams={allTeams} groups={allGroups} />
    </div>
  );
}
