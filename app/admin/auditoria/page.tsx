import { desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auditLog, profiles } from "@/lib/db/schema";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shell/page-header";
import { formatDateTime } from "@/lib/utils";

export const metadata = { title: "Auditoría · Admin" };

export default async function AuditPage() {
  const logs = await db.select().from(auditLog).orderBy(desc(auditLog.createdAt)).limit(200);
  const adminIds = Array.from(new Set(logs.map((l) => l.adminId).filter((x): x is string => !!x)));
  const admins = adminIds.length > 0 ? await db.select().from(profiles) : [];
  const adminById = new Map(admins.map((a) => [a.id, a]));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Auditoría"
        description="Registro de todas las acciones administrativas. Útil para rastrear cambios."
      />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-44">Cuándo</TableHead>
              <TableHead>Admin</TableHead>
              <TableHead>Acción</TableHead>
              <TableHead>Payload</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((l) => {
              const admin = l.adminId ? adminById.get(l.adminId) : null;
              return (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">
                    {formatDateTime(l.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">
                    {admin?.nickname ?? admin?.email ?? "—"}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{l.action}</TableCell>
                  <TableCell className="font-mono text-xs text-[var(--color-muted-foreground)]">
                    {l.payloadJson ? JSON.stringify(l.payloadJson) : "—"}
                  </TableCell>
                </TableRow>
              );
            })}
            {logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-12 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Aún no hay registros.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
