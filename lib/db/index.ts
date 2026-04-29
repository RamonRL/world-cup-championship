import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Add it to your .env.local.");
}

declare global {
  var __pg: ReturnType<typeof postgres> | undefined;
}

const client =
  globalThis.__pg ??
  postgres(connectionString, {
    max: 10,
    prepare: false,
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__pg = client;
}

export const db = drizzle(client, { schema, casing: "snake_case" });
export type Database = typeof db;
export { schema };
