// Script de una sola vez: crea 5 productos para cada una de estas
// subcategorías de Cadenas y Llaveros: Cadenas para cartera/mochila y
// Cadenas para pantalón (10 productos en total).
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-cadenas-subcategorias.cjs
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
// (no el slug): las subcategorías de este proyecto se crearon a mano desde
// el panel de admin, así que su slug real puede traer palabras extra (ej.
// "cadenas-para-cartera-mochila", con "-para-", en vez de
// "cadenas-cartera-mochila" que trae el seed estático de lib/categories.ts).
// Para no depender de adivinar el slug exacto, más abajo se busca la
// categoría comparando slugify(nombre) contra slugify(esta clave) —
// funciona igual sin importar cómo haya quedado el slug guardado.
const PRODUCTS_BY_SUBCATEGORY = {
  "Cadenas para cartera/mochila": [
    {
      name: "Cadena Plateada para Bolso",
      sku: "CCM-001",
      price: 190,
      stock: 25,
      shortDescription: "Cadena plateada con mosquetones para bolso.",
      description:
        "Cadena metálica de acabado plateado con mosquetón en cada extremo, fácil de enganchar como asa o correa cruzada para bolsos y carteras.",
      attributes: { material: "metal", acabado: "plateado", largo_cm: 55 },
    },
    {
      name: "Cadena Dorada Extensible para Cartera",
      sku: "CCM-002",
      price: 210,
      stock: 20,
      shortDescription: "Cadena dorada extensible, ajustable en largo.",
      description:
        "Cadena de acabado dorado con eslabones extensibles que permiten ajustar el largo según el bolso o cartera. Mosquetones resistentes en ambos extremos.",
      attributes: { material: "metal", acabado: "dorado", largo_cm: "50-70 (ajustable)" },
    },
    {
      name: "Cadena Gruesa Tipo Cubana para Mochila",
      sku: "CCM-003",
      price: 240,
      stock: 15,
      shortDescription: "Cadena de eslabón grueso estilo cubana.",
      description:
        "Cadena de eslabón grueso estilo cubana, pensada para dar un toque statement a mochilas y bolsos. Mosquetón reforzado para uso diario.",
      attributes: { material: "metal", estilo: "cubana", largo_cm: 60 },
    },
    {
      name: "Cadena Fina Minimalista para Bolso",
      sku: "CCM-004",
      price: 160,
      stock: 22,
      shortDescription: "Cadena fina y minimalista, bajo perfil.",
      description:
        "Cadena de eslabón fino y diseño minimalista, ideal para quienes buscan un accesorio discreto para colgar bolsos pequeños o carteras.",
      attributes: { material: "metal", estilo: "minimalista", largo_cm: 45 },
    },
    {
      name: "Cadena con Mosquetón Doble para Mochila",
      sku: "CCM-005",
      price: 200,
      stock: 18,
      shortDescription: "Cadena con mosquetón doble en ambos extremos.",
      description:
        "Cadena resistente con mosquetón doble en cada extremo para mayor seguridad al colgarla de mochilas. Acabado antióxido.",
      attributes: { material: "metal", acabado: "antióxido", largo_cm: 55 },
    },
  ],
  "Cadenas para pantalón": [
    {
      name: "Cadena Wallet Clásica para Pantalón",
      sku: "CPA-001",
      price: 170,
      stock: 25,
      shortDescription: "Cadena wallet clásica, estilo motociclista.",
      description:
        "Cadena tipo wallet clásica que se sujeta al pasador del pantalón por un lado y a la billetera por el otro. Estilo motociclista atemporal.",
      attributes: { material: "metal", estilo: "clásico", largo_cm: 40 },
    },
    {
      name: "Cadena Doble Eslabón para Jean",
      sku: "CPA-002",
      price: 220,
      stock: 18,
      shortDescription: "Cadena de doble eslabón para colgar del jean.",
      description:
        "Cadena de doble hilera de eslabones, más vistosa, pensada para colgar del pasador del jean como accesorio statement.",
      attributes: { material: "metal", estilo: "doble eslabón", largo_cm: 45 },
    },
    {
      name: "Cadena Corta con Clip para Cinturón",
      sku: "CPA-003",
      price: 150,
      stock: 20,
      shortDescription: "Cadena corta con clip, fácil de enganchar al cinturón.",
      description:
        "Cadena corta con clip a presión en un extremo, pensada para engancharse directo al cinturón o pasador sin necesidad de mosquetón.",
      attributes: { material: "metal", largo_cm: 25 },
    },
    {
      name: "Cadena Gótica Estilo Punk para Pantalón",
      sku: "CPA-004",
      price: 230,
      stock: 14,
      shortDescription: "Cadena gruesa estilo gótico/punk.",
      description:
        "Cadena de eslabón grueso con acabado oscuro, estética gótica/punk. Ideal para looks alternativos, se sujeta al pasador del pantalón.",
      attributes: { material: "metal", acabado: "negro envejecido", largo_cm: 50 },
    },
    {
      name: "Cadena Minimalista para Bolsillo",
      sku: "CPA-005",
      price: 140,
      stock: 22,
      shortDescription: "Cadena fina para el bolsillo del pantalón.",
      description:
        "Cadena fina y discreta que se sujeta del pasador y cuelga hacia el bolsillo del pantalón. Diseño minimalista, fácil de combinar.",
      attributes: { material: "metal", estilo: "minimalista", largo_cm: 30 },
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
    // desde el seed estático o a mano en el panel de admin (que puede
    // generar un slug con palabras extra, ej. "-para-").
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
    for (const subSlug of targetNames) {
      const category = categoryByTargetName.get(subSlug);
      for (const item of PRODUCTS_BY_SUBCATEGORY[subSlug]) {
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
