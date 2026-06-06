import { defineConfig } from "prisma/config";
import path from "path";

export default defineConfig({
  schema: path.join("prisma", "schema.prisma"),
  // Prisma 7: URL must be here, NOT in schema.prisma.
  // Use DIRECT_URL for db push / migrate so it bypasses Supabase's PgBouncer
  // pooler, which rejects DDL statements. Falls back to DATABASE_URL locally.
  datasource: {
    url: (process.env.DIRECT_URL ?? process.env.DATABASE_URL) as string,
  },
});
