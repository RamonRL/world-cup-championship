import { AlertTriangle, Database, ExternalLink, ServerCog, Zap } from "lucide-react";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata = { title: "Sistema · Monitoreo" };
export const dynamic = "force-dynamic";

type TableSizeRow = { tableName: string; sizePretty: string; rows: number };
type ConnRow = { state: string | null; count: number };

export default async function MonitoringSistemaPage() {
  await requireAdmin();

  // Tamaño de las tablas más pesadas del esquema public. Reltuples es una
  // estimación rápida (no exact count) — para un dashboard de salud es
  // suficiente y evita un seq scan en tablas grandes.
  const tableSizesRaw = await db.execute<TableSizeRow>(sql`
    SELECT
      c.relname                                            AS "tableName",
      pg_size_pretty(pg_total_relation_size(c.oid))        AS "sizePretty",
      c.reltuples::bigint::int                             AS rows
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relkind = 'r'
    ORDER BY pg_total_relation_size(c.oid) DESC
    LIMIT 12
  `);
  const tableSizes = tableSizesRaw as TableSizeRow[];

  // Estado de conexiones a la DB. Útil para detectar leaks en transaction
  // pooler. Filtramos por el datname actual para no mezclar con otras DBs
  // que pudieran compartir el cluster.
  const connectionsRaw = await db.execute<ConnRow>(sql`
    SELECT
      state                AS state,
      count(*)::int        AS count
    FROM pg_stat_activity
    WHERE datname = current_database()
    GROUP BY state
    ORDER BY count DESC
  `);
  const connections = connectionsRaw as ConnRow[];
  const totalConnections = connections.reduce((s, r) => s + r.count, 0);
  const sentryUrl = process.env.SENTRY_DASHBOARD_URL ?? null;

  return (
    <div className="space-y-6">
      {/* ───────── Sentry placeholder ───────── */}
      <section
        className={`rounded-xl border p-5 ${
          sentryUrl
            ? "border-[var(--color-arena)]/40 bg-[color-mix(in_oklch,var(--color-arena)_5%,var(--color-surface))]"
            : "border-dashed border-[var(--color-border)] bg-[var(--color-surface)]"
        }`}
      >
        <header className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle
              className={`size-4 ${sentryUrl ? "text-[var(--color-arena)]" : "text-[var(--color-muted-foreground)]"}`}
            />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em] text-[var(--color-muted-foreground)]">
              Errores y Web Vitals
            </p>
          </div>
          <Badge
            variant={sentryUrl ? "default" : "outline"}
            className="text-[0.55rem]"
          >
            {sentryUrl ? "Sentry conectado" : "Sin conectar"}
          </Badge>
        </header>
        {sentryUrl ? (
          <a
            href={sentryUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-[var(--color-arena)] bg-[var(--color-arena)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[var(--shadow-arena)]"
          >
            Abrir Sentry
            <ExternalLink className="size-3.5" />
          </a>
        ) : (
          <div className="space-y-2 text-sm text-[var(--color-muted-foreground)]">
            <p>
              Aún no has conectado Sentry. Pasos:
            </p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>
                Crea un proyecto Next.js gratis en{" "}
                <a
                  className="text-[var(--color-arena)] underline-offset-2 hover:underline"
                  href="https://sentry.io/signup/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  sentry.io
                </a>
                .
              </li>
              <li>
                Ejecuta:{" "}
                <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-xs">
                  pnpm add @sentry/nextjs
                </code>{" "}
                +{" "}
                <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-xs">
                  npx @sentry/wizard@latest -i nextjs
                </code>
                .
              </li>
              <li>
                Añade <code className="rounded bg-[var(--color-surface-2)] px-1.5 py-0.5 font-mono text-xs">SENTRY_DASHBOARD_URL</code>{" "}
                a tu .env apuntando a la URL del proyecto en Sentry — esta card pasará a azul y enseñará un botón directo.
              </li>
            </ol>
          </div>
        )}
      </section>

      {/* ───────── Conexiones DB ───────── */}
      <section className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <header className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
            <Zap className="size-4" />
            <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">
              Conexiones Postgres activas
            </p>
          </div>
          <Badge variant="outline" className="text-[0.55rem]">
            {totalConnections} total
          </Badge>
        </header>
        {connections.length === 0 ? (
          <p className="font-editorial text-sm italic text-[var(--color-muted-foreground)]">
            Sin actividad.
          </p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {connections.map((c) => (
              <li
                key={c.state ?? "idle-in-tx"}
                className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2"
              >
                <p className="font-mono text-[0.55rem] uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                  {c.state ?? "(sin estado)"}
                </p>
                <p className="mt-0.5 font-display tabular text-2xl tracking-tight">
                  {c.count}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ───────── Tamaño de tablas ───────── */}
      <section className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <header className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-3 text-[var(--color-muted-foreground)]">
          <Database className="size-4" />
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">
            Tablas más pesadas
          </p>
        </header>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tabla</TableHead>
              <TableHead className="text-right">Tamaño</TableHead>
              <TableHead className="text-right">Filas (aprox)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tableSizes.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-8 text-center text-sm text-[var(--color-muted-foreground)]"
                >
                  Sin datos.
                </TableCell>
              </TableRow>
            ) : null}
            {tableSizes.map((t) => (
              <TableRow key={t.tableName}>
                <TableCell className="font-mono text-xs">{t.tableName}</TableCell>
                <TableCell className="text-right font-mono text-xs">{t.sizePretty}</TableCell>
                <TableCell className="text-right font-mono text-xs text-[var(--color-muted-foreground)]">
                  {t.rows.toLocaleString("es-ES")}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </section>

      {/* ───────── Notas ───────── */}
      <section className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
          <ServerCog className="size-4" />
          <p className="font-mono text-[0.6rem] uppercase tracking-[0.32em]">Notas</p>
        </div>
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          El conteo de filas es una estimación (`pg_class.reltuples`) — exact count requeriría un
          seq scan en tablas grandes. Las queries lentas se podrán listar añadiendo
          `pg_stat_statements` (Supabase Pro lo expone via Studio); en este dashboard se puede
          incorporar luego.
        </p>
      </section>
    </div>
  );
}
