import Image from "next/image";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { groups, groupStandings, teams } from "@/lib/db/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shell/empty-state";
import { PageHeader } from "@/components/shell/page-header";
import { Users } from "lucide-react";

export const metadata = { title: "Grupos" };

export default async function GroupsPage() {
  const [allGroups, allTeams, standings] = await Promise.all([
    db.select().from(groups).orderBy(asc(groups.code)),
    db.select().from(teams).orderBy(asc(teams.name)),
    db.select().from(groupStandings),
  ]);
  const teamsByGroup = new Map<number, typeof allTeams>();
  for (const t of allTeams) {
    if (t.groupId) {
      const arr = teamsByGroup.get(t.groupId) ?? [];
      arr.push(t);
      teamsByGroup.set(t.groupId, arr);
    }
  }
  const standingByPair = new Map<string, (typeof standings)[number]>();
  for (const s of standings) {
    standingByPair.set(`${s.groupId}-${s.teamId}`, s);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Fase de grupos"
        title="12 grupos"
        description="2 primeros + 8 mejores terceros pasan al cuadro de eliminación directa (R32)."
      />
      {allGroups.length === 0 ? (
        <EmptyState
          icon={<Users className="size-5" />}
          title="Sin grupos"
          description="El admin todavía no ha creado los grupos."
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {allGroups.map((g) => {
            const groupTeams = teamsByGroup.get(g.id) ?? [];
            const sorted = [...groupTeams].sort((a, b) => {
              const sa = standingByPair.get(`${g.id}-${a.id}`)?.position ?? 99;
              const sb = standingByPair.get(`${g.id}-${b.id}`)?.position ?? 99;
              return sa - sb;
            });
            return (
              <Card key={g.id}>
                <CardHeader>
                  <CardTitle>{g.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10">#</TableHead>
                        <TableHead>Selección</TableHead>
                        <TableHead className="text-right">PJ</TableHead>
                        <TableHead className="text-right">G</TableHead>
                        <TableHead className="text-right">E</TableHead>
                        <TableHead className="text-right">P</TableHead>
                        <TableHead className="text-right">GF</TableHead>
                        <TableHead className="text-right">GC</TableHead>
                        <TableHead className="text-right">Pts</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sorted.length === 0 ? (
                        <TableRow>
                          <TableCell
                            colSpan={9}
                            className="py-6 text-center text-xs text-[var(--color-muted-foreground)]"
                          >
                            Selecciones aún sin asignar.
                          </TableCell>
                        </TableRow>
                      ) : (
                        sorted.map((t, i) => {
                          const s = standingByPair.get(`${g.id}-${t.id}`);
                          return (
                            <TableRow key={t.id}>
                              <TableCell className="font-mono text-xs">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="grid size-5 place-items-center overflow-hidden rounded-sm border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                                    {t.flagUrl ? (
                                      <Image
                                        src={t.flagUrl}
                                        alt={t.code}
                                        width={20}
                                        height={20}
                                      />
                                    ) : null}
                                  </span>
                                  <span className="font-medium">{t.name}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{s?.played ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{s?.won ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{s?.drawn ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{s?.lost ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{s?.goalsFor ?? 0}</TableCell>
                              <TableCell className="text-right tabular-nums">{s?.goalsAgainst ?? 0}</TableCell>
                              <TableCell className="text-right font-display tabular-nums">
                                {s?.points ?? 0}
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
