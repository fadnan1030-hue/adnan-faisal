
// dotenv only matters for local dev (loading .env); on Vercel/CI the
// platform injects env vars directly, so a missing/unresolvable dotenv
// module here must never fail the whole config load.
try {
  await import("dotenv/config");
} catch {
  // no .env file / dotenv unavailable - fine when env vars are already set
}

import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
