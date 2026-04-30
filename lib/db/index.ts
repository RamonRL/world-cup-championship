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
//
// `max: 5` is a balance: high enough that Promise.all parallel queries don't
// serialize (which would blow up our static generation), low enough that with
// many concurrent serverless invocations we don't exhaust Supabase's
// connection cap. If `DATABASE_URL` points at the Supabase transactional
// pooler (port 6543, recommended for serverless), the pooler handles the
// real fan-out and `max` just controls fan-in per Lambda.
const client =
  globalThis.__pg ??
  postgres(connectionString, {
    max: 5,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  });

globalThis.__pg = client;

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Database = typeof db;
export { schema };
