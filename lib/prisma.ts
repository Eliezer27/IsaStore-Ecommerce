import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

// Prisma ORM 7 quitó el motor de conexión interno: PrismaClient ya no se
// puede instanciar sin argumentos ("PrismaClient needs to be constructed
// with a non-empty, valid PrismaClientOptions"). Ahora requiere un driver
// adapter explícito — aquí usamos @prisma/adapter-pg sobre un Pool de "pg".
//
// Se cachean tanto el Pool como el PrismaClient en globalThis (patrón
// estándar de Prisma para Next.js) para que el hot-reload de desarrollo no
// abra una conexión nueva en cada cambio de archivo.

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pgPool: Pool | undefined;
};

const pool =
  globalForPrisma.pgPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
  });

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
