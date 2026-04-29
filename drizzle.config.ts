import { defineConfig } from "drizzle-kit";
import { readFileSync } from "node:fs";

// drizzle-kit launches its own process and does not auto-load .env.local.
// We read it here so `pnpm db:push` works without extra wrappers.
function loadDotEnv(path: string) {
  try {
    const content = readFileSync(path, "utf8");
    for (const rawLine of content.split("\n")) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eq = line.indexOf("=");
      if (eq === -1) continue;
      const key = line.slice(0, eq).trim();
      let value = line.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) process.env[key] = value;
    }
  } catch {
    // file missing — fine, env vars may come from the shell.
  }
}

loadDotEnv(".env.local");
loadDotEnv(".env");

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
