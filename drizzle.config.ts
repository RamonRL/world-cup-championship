import { defineConfig } from "drizzle-kit";

const url =
  process.env.DATABASE_DIRECT_URL ?? process.env.DATABASE_URL ?? "postgres://localhost:5432/postgres";

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: { url },
  schemaFilter: ["public"],
  verbose: true,
  strict: true,
});
