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

// node-postgres emite un evento "error" en el Pool cuando un cliente inactivo
// pierde la conexión (ej. DATABASE_URL todavía apunta a un Postgres de
// relleno que no existe). Si nadie escucha ese evento, Node lo trata como una
// excepción no capturada y puede tumbar el server de "next dev" entero. Este
// listener evita eso — el error real ya se maneja donde se hace cada query
// (los try/catch de las páginas).
if (!globalForPrisma.pgPool) {
  pool.on("error", (err) => {
    console.warn("[db] conexión perdida/no disponible:", err.message);
  });
}

const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    // Sin logging propio de Prisma: cada página que llama a Prisma ya envuelve
    // la query en try/catch y registra un solo aviso corto si falla (ver
    // getFeaturedProducts/getProducts/getProduct/getPosts). Esto evita el
    // volcado largo y en rojo de Prisma en la terminal cuando todavía no hay
    // una base de datos real conectada.
    log: [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pgPool = pool;
}
