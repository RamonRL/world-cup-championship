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

export const metadata = { title: "Usuarios · Admin" };

export default async function AdminUsersPage() {
  const users = await db.select().from(profiles).orderBy(asc(profiles.createdAt));

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin"
        title="Usuarios"
        description="Lista de participantes registrados. La gestión de baneo y cambios de rol llegará en una próxima iteración."
      />
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Participante</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Registro</TableHead>
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
                  <TableCell className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(u.createdAt).toLocaleDateString("es-ES")}
                  </TableCell>
                </TableRow>
              );
            })}
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
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
