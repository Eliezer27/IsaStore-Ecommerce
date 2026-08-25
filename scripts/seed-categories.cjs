// Script de una sola vez para crear las 6 categorías reales de IsaStore
// (mega-menú original) con el MISMO slug que ya usa lib/categories.ts en
// el sitio público (/shop?categoria=<slug>). A propósito NO reutiliza el
// slug de createCategory() (lib/admin/actions.ts), que le pega un sufijo
// random (`${slugify(name)}-${Date.now().toString(36)}`) — si esas 6
// categorías se crearan así, el slug no coincidiría con "ropa",
// "cadenas-y-llaveros", etc. y el filtro de /shop por categoría quedaría
// roto (no encontraría productos aunque los tengan asignados).
//
// Uso: node scripts/seed-categories.cjs
// Idempotente: usa ON CONFLICT (slug) para poder correrlo de nuevo sin
// duplicar filas si ya existen algunas de estas categorías.
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const CATEGORIES = [
  { name: "Ropa", slug: "ropa" },
  { name: "Cadenas y Llaveros", slug: "cadenas-y-llaveros" },
  { name: "Peluches y Juguetes", slug: "peluches-y-juguetes" },
  { name: "Collares", slug: "collares" },
  { name: "Maquillaje", slug: "maquillaje" },
  { name: "Accesorios", slug: "accesorios" },
];

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const { name, slug } = CATEGORIES[i];
      const { rows } = await pool.query(
        `insert into categories (name, slug, position, is_active)
         values ($1, $2, $3, true)
         on conflict (slug) do update set name = excluded.name, position = excluded.position
         returning id, name, slug, position, is_active`,
        [name, slug, i]
      );
      console.log("OK:", JSON.stringify(rows[0]));
    }

    const { rows: all } = await pool.query(
      "select name, slug, position from categories order by position asc"
    );
    console.log("\nCategorías en la base de datos ahora:");
    console.table(all);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
