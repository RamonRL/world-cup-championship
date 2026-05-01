import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local.");
}

declare global {
  // eslint-disable-next-line no-var
  var __pg: ReturnType<typeof postgres> | undefined;
}

// Reuse the same client across invocations on the same Lambda instance — on
// Vercel the global object survives between requests for tens of seconds to
// minutes, so this avoids paying TCP+TLS handshake cost on every page load.
const client =
  globalThis.__pg ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  });

globalThis.__pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Database = typeof db;
export { schema };
