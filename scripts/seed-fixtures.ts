import { db } from "@/lib/db";
import { matchdays } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

/**
 * Seed the 9 jornadas del Mundial 2026 con sus deadlines de predicción
 * (24h antes del primer partido conocido de cada jornada según el calendario
 * oficial de FIFA publicado en 2024). Los horarios son en UTC; puedes
 * ajustarlos desde /admin/calendario una vez verificados con la fuente
 * oficial.
 *
 * Idempotente: aborta si ya existen matchdays.
 */

type Fixture = {
  name: string;
  stage: "group" | "r32" | "r16" | "qf" | "sf" | "third" | "final";
  predictionDeadlineAt: string;
  orderIndex: number;
};

const FIXTURES: Fixture[] = [
  {
    name: "Fase de grupos · Jornada 1",
    stage: "group",
    // kickoff Mundial: 11-jun-2026 20:00 UTC. Cierre 24h antes.
    predictionDeadlineAt: "2026-06-10T20:00:00Z",
    orderIndex: 1,
  },
  {
    name: "Fase de grupos · Jornada 2",
    stage: "group",
    // primer partido J2 aproximado: 17-jun-2026.
    predictionDeadlineAt: "2026-06-16T20:00:00Z",
    orderIndex: 2,
  },
  {
    name: "Fase de grupos · Jornada 3",
    stage: "group",
    // primer partido J3 aproximado: 23-jun-2026.
    predictionDeadlineAt: "2026-06-22T20:00:00Z",
    orderIndex: 3,
  },
  {
    name: "Dieciseisavos (R32)",
    stage: "r32",
    // R32 arranca: 28-jun-2026.
    predictionDeadlineAt: "2026-06-27T20:00:00Z",
    orderIndex: 4,
  },
  {
    name: "Octavos de final",
    stage: "r16",
    // R16 arranca: 4-jul-2026.
    predictionDeadlineAt: "2026-07-03T20:00:00Z",
    orderIndex: 5,
  },
  {
    name: "Cuartos de final",
    stage: "qf",
    // QF arrancan: 9-jul-2026.
    predictionDeadlineAt: "2026-07-08T20:00:00Z",
    orderIndex: 6,
  },
  {
    name: "Semifinales",
    stage: "sf",
    // SF arrancan: 14-jul-2026.
    predictionDeadlineAt: "2026-07-13T20:00:00Z",
    orderIndex: 7,
  },
  {
    name: "Tercer puesto",
    stage: "third",
    // 3er puesto: 18-jul-2026.
    predictionDeadlineAt: "2026-07-17T20:00:00Z",
    orderIndex: 8,
  },
  {
    name: "Final",
    stage: "final",
    // Final: 19-jul-2026 en MetLife Stadium.
    predictionDeadlineAt: "2026-07-18T20:00:00Z",
    orderIndex: 9,
  },
];

async function main() {
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchdays);

  if (count > 0) {
    console.error(
      `\n× Ya hay ${count} jornadas creadas. Abortando para no duplicar.`,
    );
    console.error(
      `  Si quieres regenerar, borra primero las jornadas existentes desde Drizzle Studio o pgAdmin.\n`,
    );
    process.exit(1);
  }

  console.log("→ Creando 9 jornadas del Mundial 2026…");
  await db.insert(matchdays).values(
    FIXTURES.map((f) => ({
      name: f.name,
      stage: f.stage,
      predictionDeadlineAt: new Date(f.predictionDeadlineAt),
      orderIndex: f.orderIndex,
    })),
  );

  console.log(`✓ ${FIXTURES.length} jornadas creadas.`);
  console.log(
    `  Verifica/ajusta los deadlines en /admin/calendario antes de cargar partidos.`,
  );
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed-fixtures failed:", err);
  process.exit(1);
});
