import { asc } from "drizzle-orm";
import { db } from "@/lib/db";
import { profiles } from "@/lib/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/shell/page-header";
import { initials } from "@/lib/utils";
import { UserActions } from "./user-actions";

export const metadata = { title: "Usuarios · Admin" };

export default async function AdminUsersPage() {
  const users = await db.select().from(profiles).orderBy(asc(profiles.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Usuarios"
        description="Participantes registrados. Cambia su rol o suspéndelos / reactívalos según necesites."
      />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participante</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Registro</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => {
              const display = u.nickname || u.email.split("@")[0];
              return (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="size-8">
                        {u.avatarUrl ? <AvatarImage src={u.avatarUrl} alt="" /> : null}
                        <AvatarFallback>{initials(display)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{display}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                    {u.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === "admin" ? "danger" : "outline"}>{u.role}</Badge>
                  </TableCell>
                  <TableCell>
                    {u.bannedAt ? (
                      <Badge variant="danger">Suspendido</Badge>
                    ) : (
                      <Badge variant="success">Activo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(u.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                  <TableCell className="text-right">
                    <UserActions
                      userId={u.id}
                      role={u.role}
                      banned={u.bannedAt != null}
                      displayName={display}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Aún no hay usuarios registrados.
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
