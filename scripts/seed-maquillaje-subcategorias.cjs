// Script de una sola vez: crea 5 productos para cada una de estas
// subcategorías de Maquillaje: Ojos (sombras, delineador, pestañas) y
// Labios (labial, gloss, delineador) (10 productos en total).
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-maquillaje-subcategorias.cjs
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
  "Ojos (sombras, delineador, pestañas)": [
    {
      name: "Paleta de Sombras Neutras 12 Tonos",
      sku: "MAQ-OJ-001",
      price: 480,
      stock: 16,
      shortDescription: "Paleta de 12 sombras en tonos neutros.",
      description:
        "Paleta de 12 sombras en tonos neutros mate y shimmer, alta pigmentación y fácil de difuminar. Incluye espejo interno.",
      attributes: { tonos: 12, acabado: "mate/shimmer" },
    },
    {
      name: "Delineador Líquido Waterproof",
      sku: "MAQ-OJ-002",
      price: 220,
      stock: 25,
      shortDescription: "Delineador líquido negro, resistente al agua.",
      description:
        "Delineador líquido de punta fina para trazos precisos, fórmula waterproof de larga duración que no se corre durante el día.",
      attributes: { color: "negro", tipo: "líquido waterproof" },
    },
    {
      name: "Máscara de Pestañas Volumen Extremo",
      sku: "MAQ-OJ-003",
      price: 260,
      stock: 20,
      shortDescription: "Máscara de pestañas para volumen extremo.",
      description:
        "Máscara de pestañas con cepillo curvo que separa y aporta volumen extremo desde la raíz. Fórmula de larga duración, no se apelmaza.",
      attributes: { color: "negro", efecto: "volumen" },
    },
    {
      name: "Delineador en Gel Negro",
      sku: "MAQ-OJ-004",
      price: 210,
      stock: 18,
      shortDescription: "Delineador en gel, acabado intenso y duradero.",
      description:
        "Delineador en gel de textura cremosa y fácil aplicación, color negro intenso de larga duración. Incluye pincel aplicador.",
      attributes: { color: "negro", tipo: "gel" },
    },
    {
      name: "Paleta de Sombras Shimmer 9 Tonos",
      sku: "MAQ-OJ-005",
      price: 420,
      stock: 14,
      shortDescription: "Paleta de 9 sombras con acabado shimmer.",
      description:
        "Paleta de 9 sombras con acabado shimmer y metálico, ideal para looks de noche. Alta pigmentación y buena adherencia.",
      attributes: { tonos: 9, acabado: "shimmer" },
    },
  ],
  "Labios (labial, gloss, delineador)": [
    {
      name: "Labial Mate Larga Duración",
      sku: "MAQ-LA-001",
      price: 240,
      stock: 22,
      shortDescription: "Labial líquido mate de larga duración.",
      description:
        "Labial líquido de acabado mate y larga duración, fórmula ligera que no reseca los labios. Cobertura completa en una sola pasada.",
      attributes: { acabado: "mate", color: "rojo clásico" },
    },
    {
      name: "Gloss Labial Efecto Cristal",
      sku: "MAQ-LA-002",
      price: 190,
      stock: 25,
      shortDescription: "Gloss labial con efecto cristal, brillo intenso.",
      description:
        "Gloss labial de fórmula no pegajosa con efecto cristal, aporta brillo intenso y un toque de volumen. Aplicador de punta suave.",
      attributes: { acabado: "brillante", color: "transparente" },
    },
    {
      name: "Delineador de Labios Nude",
      sku: "MAQ-LA-003",
      price: 150,
      stock: 20,
      shortDescription: "Delineador de labios en tono nude.",
      description:
        "Delineador de labios en tono nude versátil, textura cremosa fácil de difuminar. Ideal para definir el contorno antes del labial.",
      attributes: { color: "nude", tipo: "lápiz" },
    },
    {
      name: "Labial Líquido Tinta",
      sku: "MAQ-LA-004",
      price: 260,
      stock: 18,
      shortDescription: "Labial líquido tipo tinta, efecto matte.",
      description:
        "Labial líquido tipo tinta de secado rápido y acabado matte, alta resistencia a transferencia. Duración de todo el día.",
      attributes: { acabado: "matte", color: "rosa fuerte" },
    },
    {
      name: "Bálsamo Labial con Color",
      sku: "MAQ-LA-005",
      price: 170,
      stock: 24,
      shortDescription: "Bálsamo labial hidratante con un toque de color.",
      description:
        "Bálsamo labial hidratante con un toque de color natural, ideal para uso diario. Fórmula suave con ingredientes nutritivos.",
      attributes: { acabado: "natural", color: "rosa suave" },
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
