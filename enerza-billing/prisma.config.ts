// This file configures Prisma 7 CLI behaviour (migrations, seed, datasource)
import "dotenv/config";
import path from "path";
import { defineConfig } from "prisma/config";

// Construct absolute path to the SQLite database
const dbPath = path.resolve(__dirname, "dev.db");

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"] ?? `file:${dbPath}`,
  },
});
