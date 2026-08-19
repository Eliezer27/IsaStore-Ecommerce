// Prisma ORM 7: la conexión a la base de datos ya no se define en
// prisma/schema.prisma — vive aquí. Este archivo lo usa el CLI de Prisma
// (generate, migrate, db push, studio), no la app en tiempo de ejecución
// (eso lo maneja lib/prisma.ts con @prisma/adapter-pg).
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // DIRECT_URL (conexión directa, sin pgbouncer/pooling) porque las
    // migraciones no pueden correr a través de un pooler de transacciones
    // como el que usa Supabase por defecto en DATABASE_URL.
    url: env("DIRECT_URL"),
  },
});
