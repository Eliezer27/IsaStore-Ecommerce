// Script de una sola vez para crear las 6 categorías reales de IsaStore
// CON sus subcategorías (jerarquía padre/hijo vía parent_id), usando los
// MISMOS slugs que ya usa lib/categories.ts en el sitio público
// (/shop?categoria=<slug>&subcategoria=<slug>). A propósito NO reutiliza el
// slug de createCategory() (lib/admin/actions.ts), que le pega un sufijo
// random (`${slugify(name)}-${Date.now().toString(36)}`) — si estas filas
// se crearan así, el slug no coincidiría con "ropa", "camisas-blusas", etc.
// y el filtro de /shop quedaría roto (no encontraría productos aunque los
// tengan asignados).
//
// Regla usada para decidir en qué categoría cae cada producto:
//   - ¿Se usa en el cuello?               -> Collares
//   - ¿Es para un objeto (cartera,
//     llaves, pantalón)?                  -> Cadenas y Llaveros
//   - ¿Es cualquier otro accesorio
//     de vestir (no cuello)?              -> Accesorios
// Collares se deja sin subcategorías a propósito.
//
// Uso: node scripts/seed-categories.cjs
// Idempotente: usa ON CONFLICT (slug) para poder correrlo de nuevo sin
// duplicar filas si ya existen algunas de estas categorías/subcategorías.
// También actualiza parent_id en el UPDATE, por si una subcategoría ya
// existía suelta (sin padre) de antes.
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

const CATEGORIES = [
  {
    name: "Ropa",
    slug: "ropa",
    subcategories: [
      { name: "Camisas / Blusas", slug: "camisas-blusas" },
      { name: "Pantalones", slug: "pantalones" },
      { name: "Vestidos", slug: "vestidos" },
      { name: "Ropa deportiva", slug: "ropa-deportiva" },
      { name: "Sudaderas / Hoodies", slug: "sudaderas-hoodies" },
      { name: "Shorts / Faldas", slug: "shorts-faldas" },
    ],
  },
  {
    name: "Cadenas y Llaveros",
    slug: "cadenas-y-llaveros",
    subcategories: [
      { name: "Cadenas para cartera/mochila", slug: "cadenas-cartera-mochila" },
      { name: "Cadenas para pantalón", slug: "cadenas-pantalon" },
      { name: "Llaveros temáticos", slug: "llaveros-tematicos" },
      { name: "Llaveros personalizados", slug: "llaveros-personalizados" },
    ],
  },
  {
    name: "Peluches y Juguetes",
    slug: "peluches-y-juguetes",
    subcategories: [
      { name: "Peluches", slug: "peluches" },
      { name: "Figuras coleccionables", slug: "figuras-coleccionables" },
    ],
  },
  {
    name: "Collares",
    slug: "collares",
    subcategories: [], // sin subcategorías, a propósito
  },
  {
    name: "Maquillaje",
    slug: "maquillaje",
    subcategories: [
      { name: "Rostro (base, corrector, polvo)", slug: "rostro" },
      { name: "Ojos (sombras, delineador, pestañas)", slug: "ojos" },
      { name: "Labios (labial, gloss, delineador)", slug: "labios" },
      { name: "Kits / Sets", slug: "kits-sets" },
    ],
  },
  {
    name: "Accesorios",
    slug: "accesorios",
    subcategories: [
      { name: "Aretes", slug: "aretes" },
      { name: "Pulseras", slug: "pulseras" },
      { name: "Anillos", slug: "anillos" },
      { name: "Bolsos / Carteras pequeñas", slug: "bolsos-carteras-pequenas" },
      { name: "Gorras / Sombreros", slug: "gorras-sombreros" },
      { name: "Lentes de sol", slug: "lentes-de-sol" },
    ],
  },
];

async function upsertCategory(pool, { name, slug, position, parentId }) {
  const { rows } = await pool.query(
    `insert into categories (name, slug, position, parent_id, is_active)
     values ($1, $2, $3, $4, true)
     on conflict (slug) do update
       set name = excluded.name,
           position = excluded.position,
           parent_id = excluded.parent_id
     returning id, name, slug, position, parent_id, is_active`,
    [name, slug, position, parentId ?? null]
  );
  return rows[0];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    for (let i = 0; i < CATEGORIES.length; i++) {
      const cat = CATEGORIES[i];
      const parentRow = await upsertCategory(pool, {
        name: cat.name,
        slug: cat.slug,
        position: i,
        parentId: null,
      });
      console.log("OK categoría:", JSON.stringify(parentRow));

      for (let j = 0; j < cat.subcategories.length; j++) {
        const sub = cat.subcategories[j];
        const subRow = await upsertCategory(pool, {
          name: sub.name,
          slug: sub.slug,
          position: j,
          parentId: parentRow.id,
        });
        console.log("  OK subcategoría:", JSON.stringify(subRow));
      }
    }

    const { rows: all } = await pool.query(
      `select c.name, c.slug, c.position, p.slug as parent_slug
       from categories c
       left join categories p on p.id = c.parent_id
       order by coalesce(p.position, c.position), p.slug nulls first, c.position`
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
