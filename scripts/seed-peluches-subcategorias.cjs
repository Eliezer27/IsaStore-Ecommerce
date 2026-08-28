// Script de una sola vez: crea 5 productos para cada una de estas
// subcategorías de Peluches y Juguetes: Peluches y Figuras coleccionables
// (10 productos en total).
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-peluches-subcategorias.cjs
//
// No es idempotente a propósito: si lo corrés dos veces, crea otra tanda
// de 10 productos (el slug se genera con un sufijo aleatorio para que
// nunca choque con el @unique).
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const crypto = require("crypto");

function slugify(input) {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // quita acentos, igual que lib/slugify.ts
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Las claves son el NOMBRE tal cual se ve en /admin/productos/categorias
// (no el slug): las subcategorías se crearon a mano desde el panel de
// admin, así que su slug real puede no coincidir con lo que asume el seed
// estático de lib/categories.ts. Más abajo se busca la categoría
// comparando slugify(nombre) contra slugify(esta clave), así funciona
// sin importar cómo haya quedado el slug guardado.
const PRODUCTS_BY_SUBCATEGORY = {
  Peluches: [
    {
      name: "Peluche Oso Abrazable 30cm",
      sku: "PEL-P-001",
      price: 380,
      stock: 18,
      shortDescription: "Peluche de oso suave, 30cm, ideal para regalar.",
      description:
        "Peluche de oso ultra suave de 30cm de alto, relleno hipoalergénico. Perfecto como regalo o para decorar la cama o el cuarto.",
      attributes: { material: "felpa", alto_cm: 30 },
    },
    {
      name: "Peluche Conejo Orejas Largas 25cm",
      sku: "PEL-P-002",
      price: 340,
      stock: 20,
      shortDescription: "Peluche de conejo con orejas largas, 25cm.",
      description:
        "Peluche de conejo con orejas largas y suaves, 25cm de alto, textura afelpada. Relleno hipoalergénico, ideal para todas las edades.",
      attributes: { material: "felpa", alto_cm: 25 },
    },
    {
      name: "Peluche Gato Kawaii 20cm",
      sku: "PEL-P-003",
      price: 300,
      stock: 22,
      shortDescription: "Peluche de gato estilo kawaii, 20cm.",
      description:
        "Peluche de gato con carita estilo kawaii, tamaño compacto de 20cm, ideal para colgar de mochilas o decorar un escritorio.",
      attributes: { material: "felpa", alto_cm: 20 },
    },
    {
      name: "Peluche Perrito Corgi 28cm",
      sku: "PEL-P-004",
      price: 360,
      stock: 16,
      shortDescription: "Peluche de perrito corgi, 28cm.",
      description:
        "Peluche de perrito raza corgi con orejas paradas y colita bordada, 28cm de alto. Tela suave, relleno hipoalergénico.",
      attributes: { material: "felpa", alto_cm: 28 },
    },
    {
      name: "Peluche Unicornio Pastel 35cm",
      sku: "PEL-P-005",
      price: 420,
      stock: 14,
      shortDescription: "Peluche de unicornio en tonos pastel, 35cm.",
      description:
        "Peluche de unicornio con crin y cuerno bordados en tonos pastel, 35cm de alto. Ideal como regalo, textura muy suave al tacto.",
      attributes: { material: "felpa", alto_cm: 35 },
    },
  ],
  "Figuras coleccionables": [
    {
      name: "Figura Coleccionable Anime Chibi",
      sku: "PEL-F-001",
      price: 260,
      stock: 20,
      shortDescription: "Figura coleccionable estilo anime chibi, PVC.",
      description:
        "Figura coleccionable de PVC con acabado pintado a detalle, estilo anime chibi. Tamaño ideal para exhibir en escritorio o repisa.",
      attributes: { material: "PVC" },
    },
    {
      name: "Figura Coleccionable Dragón Mini",
      sku: "PEL-F-002",
      price: 290,
      stock: 15,
      shortDescription: "Figura coleccionable de dragón, tamaño mini.",
      description:
        "Figura coleccionable de un dragón estilizado, tamaño mini, detalles pintados a mano. Pieza decorativa para coleccionistas.",
      attributes: { material: "resina/PVC" },
    },
    {
      name: "Figura Coleccionable Astronauta",
      sku: "PEL-F-003",
      price: 270,
      stock: 18,
      shortDescription: "Figura coleccionable de astronauta, estilo pop.",
      description:
        "Figura coleccionable de un astronauta con casco y traje detallados, estilo pop. Ideal para exhibir en escritorio o repisa.",
      attributes: { material: "PVC" },
    },
    {
      name: "Figura Coleccionable Gato Cósmico",
      sku: "PEL-F-004",
      price: 250,
      stock: 20,
      shortDescription: "Figura coleccionable de gato con temática espacial.",
      description:
        "Figura coleccionable de un gato con temática espacial (casco de astronauta), acabado brillante. Pieza decorativa divertida.",
      attributes: { material: "PVC" },
    },
    {
      name: "Figura Coleccionable Robot Retro",
      sku: "PEL-F-005",
      price: 310,
      stock: 12,
      shortDescription: "Figura coleccionable de robot estilo retro.",
      description:
        "Figura coleccionable de un robot con diseño estilo retro/vintage, articulaciones visibles decorativas. Pieza para coleccionistas.",
      attributes: { material: "PVC/metal" },
    },
  ],
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const targetNames = Object.keys(PRODUCTS_BY_SUBCATEGORY);
    // Se traen TODAS las categorías y se matchea por slugify(nombre) en vez
    // de por slug guardado — así no importa si la subcategoría se creó
    // desde el seed estático o a mano en el panel de admin.
    const { rows: categoryRows } = await pool.query(
      `select id, slug, name from categories`
    );
    const categoryByNormalizedName = new Map(
      categoryRows.map((c) => [slugify(c.name), c])
    );

    const categoryByTargetName = new Map();
    const missing = [];
    for (const targetName of targetNames) {
      const category = categoryByNormalizedName.get(slugify(targetName));
      if (category) {
        categoryByTargetName.set(targetName, category);
      } else {
        missing.push(targetName);
      }
    }

    if (missing.length > 0) {
      const disponibles = categoryRows.map((c) => `${c.name} (${c.slug})`).join(", ");
      throw new Error(
        `No encontré estas subcategorías en la base de datos: ${missing.join(", ")}. ` +
          `Categorías disponibles: ${disponibles || "(ninguna)"}. Revisa /admin/productos/categorias.`
      );
    }

    const created = [];
    for (const subName of targetNames) {
      const category = categoryByTargetName.get(subName);
      for (const item of PRODUCTS_BY_SUBCATEGORY[subName]) {
        const suffix = crypto.randomBytes(3).toString("hex");
        const slug = `${slugify(item.name)}-${suffix}`;

        const { rows } = await pool.query(
          `insert into products
             (category_id, name, slug, sku, short_description, description,
              price, stock, attributes, is_active)
           values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
           returning id, name, slug`,
          [
            category.id,
            item.name,
            slug,
            item.sku,
            item.shortDescription,
            item.description,
            item.price,
            item.stock,
            JSON.stringify(item.attributes ?? {}),
          ]
        );
        created.push({ subcategory: category.name, ...rows[0] });
      }
    }

    console.log(`\nSe crearon ${created.length} producto(s) SIN imagen:\n`);
    let lastSub = null;
    for (const p of created) {
      if (p.subcategory !== lastSub) {
        console.log(`\n${p.subcategory}:`);
        lastSub = p.subcategory;
      }
      console.log(
        `- ${p.name}\n  editar/subir imagen: http://localhost:3000/admin/productos/${p.id}/editar`
      );
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
