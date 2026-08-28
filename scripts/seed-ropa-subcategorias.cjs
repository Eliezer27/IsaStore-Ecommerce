// Script de una sola vez: crea 5 productos para cada una de estas
// subcategorías de Ropa: Camisas / Blusas, Pantalones y Sudaderas / Hoodies
// (15 productos en total).
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-ropa-subcategorias.cjs
//
// No es idempotente a propósito: si lo corrés dos veces, crea otra tanda
// de 15 productos (el slug se genera con un sufijo aleatorio para que
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

const PRODUCTS_BY_SUBCATEGORY = {
  "camisas-blusas": [
    {
      name: "Blusa Cuello V Manga Corta",
      sku: "CAM-001",
      price: 380,
      stock: 20,
      shortDescription: "Blusa básica de cuello V, manga corta.",
      description:
        "Blusa de cuello en V con manga corta, tela liviana y fresca. Corte entallado favorecedor, ideal para el día a día o combinar en una oficina casual.",
      attributes: { tallas: "S-XL", color: "blanco" },
    },
    {
      name: "Camisa Oxford Manga Larga",
      sku: "CAM-002",
      price: 520,
      stock: 15,
      shortDescription: "Camisa Oxford unisex de manga larga.",
      description:
        "Camisa estilo Oxford de manga larga, tela de algodón resistente con textura ligera. Corte recto unisex, botones al frente y un bolsillo en el pecho.",
      attributes: { tallas: "S-XL", color: "celeste", manga: "larga" },
    },
    {
      name: "Blusa Off-Shoulder Estampada",
      sku: "CAM-003",
      price: 420,
      stock: 18,
      shortDescription: "Blusa off-shoulder con estampado floral.",
      description:
        "Blusa de hombros descubiertos con estampado floral, manga a 3/4 con elástico en los puños. Tela fresca y liviana, ideal para clima cálido.",
      attributes: { tallas: "S-L", color: "estampado floral" },
    },
    {
      name: "Camisa a Cuadros Casual",
      sku: "CAM-004",
      price: 480,
      stock: 16,
      shortDescription: "Camisa a cuadros de corte casual, manga larga.",
      description:
        "Camisa a cuadros de manga larga con corte casual, se puede usar abierta sobre una camiseta o abotonada. Tela de algodón suave.",
      attributes: { tallas: "S-XL", color: "cuadros rojo/negro" },
    },
    {
      name: "Blusa Crop Top Básica",
      sku: "CAM-005",
      price: 320,
      stock: 22,
      shortDescription: "Crop top básico de algodón, varios colores.",
      description:
        "Crop top de corte básico en algodón elástico, cuello redondo y manga corta. Fácil de combinar con jeans de tiro alto o faldas.",
      attributes: { tallas: "XS-L", color: "negro" },
    },
  ],
  pantalones: [
    {
      name: "Jean Skinny Tiro Alto",
      sku: "PAN-001",
      price: 650,
      stock: 18,
      shortDescription: "Jean skinny de tiro alto, mezclilla stretch.",
      description:
        "Jean de corte skinny y tiro alto, mezclilla stretch que se ajusta al cuerpo sin apretar. Cierre con botón y zíper, cinco bolsillos.",
      attributes: { tallas: "26-34", color: "azul denim" },
    },
    {
      name: "Pantalón Cargo Unisex",
      sku: "PAN-002",
      price: 590,
      stock: 20,
      shortDescription: "Pantalón cargo con bolsillos laterales.",
      description:
        "Pantalón cargo unisex de corte recto con bolsillos laterales tipo cargo. Tela resistente, cintura ajustable con cordón interno.",
      attributes: { tallas: "S-XL", color: "verde olivo" },
    },
    {
      name: "Pantalón de Vestir Recto",
      sku: "PAN-003",
      price: 720,
      stock: 12,
      shortDescription: "Pantalón de vestir de corte recto, para oficina.",
      description:
        "Pantalón de vestir de corte recto en tela con caída fluida, ideal para looks de oficina o eventos formales. Cierre con gancho y zíper.",
      attributes: { tallas: "26-34", color: "negro" },
    },
    {
      name: "Jogger Deportivo",
      sku: "PAN-004",
      price: 480,
      stock: 25,
      shortDescription: "Jogger deportivo con puño elástico en el tobillo.",
      description:
        "Jogger deportivo en tela suave tipo francela, cintura con elástico y cordón ajustable, puño elástico en el tobillo. Bolsillos laterales funcionales.",
      attributes: { tallas: "S-XL", color: "gris jaspe" },
    },
    {
      name: "Pantalón Palazzo Fluido",
      sku: "PAN-005",
      price: 550,
      stock: 16,
      shortDescription: "Pantalón palazzo de tela fluida, pierna ancha.",
      description:
        "Pantalón palazzo de pierna ancha en tela fluida, cintura elástica cómoda. Ideal para looks frescos y sueltos en clima cálido.",
      attributes: { tallas: "S-L", color: "beige" },
    },
  ],
  "sudaderas-hoodies": [
    {
      name: "Hoodie Básico Unisex",
      sku: "SUD-001",
      price: 620,
      stock: 20,
      shortDescription: "Hoodie básico unisex, algodón afelpado.",
      description:
        "Hoodie unisex de corte clásico en algodón afelpado por dentro. Capucha con cordón ajustable y bolsillo canguro al frente.",
      attributes: { tallas: "S-XL", color: "negro" },
    },
    {
      name: "Sudadera Crew Neck Estampada",
      sku: "SUD-002",
      price: 580,
      stock: 18,
      shortDescription: "Sudadera cuello redondo con estampado gráfico.",
      description:
        "Sudadera de cuello redondo (crew neck) con estampado gráfico al frente. Tela afelpada, corte relajado, puños y cintura con elástico.",
      attributes: { tallas: "S-XL", color: "gris" },
    },
    {
      name: "Hoodie Oversize Tie-Dye",
      sku: "SUD-003",
      price: 690,
      stock: 14,
      shortDescription: "Hoodie oversize con efecto tie-dye.",
      description:
        "Hoodie de corte oversize con teñido tie-dye, cada pieza con un patrón ligeramente distinto. Capucha forrada y bolsillo canguro.",
      attributes: { tallas: "M-XL", color: "tie-dye multicolor" },
    },
    {
      name: "Sudadera Zip-Up con Capucha",
      sku: "SUD-004",
      price: 650,
      stock: 16,
      shortDescription: "Sudadera con cierre completo y capucha.",
      description:
        "Sudadera con cierre (zip) completo al frente y capucha ajustable. Bolsillos laterales tipo canguro, tela afelpada abrigadora.",
      attributes: { tallas: "S-XL", color: "azul marino" },
    },
    {
      name: "Hoodie Cropped para Mujer",
      sku: "SUD-005",
      price: 560,
      stock: 20,
      shortDescription: "Hoodie cropped, corte corto a la cintura.",
      description:
        "Hoodie de corte cropped, largo hasta la cintura, ideal para combinar con jeans de tiro alto. Capucha con cordón y puños elásticos.",
      attributes: { tallas: "XS-L", color: "rosa palo" },
    },
  ],
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const subSlugs = Object.keys(PRODUCTS_BY_SUBCATEGORY);
    const { rows: categoryRows } = await pool.query(
      `select id, slug, name from categories where slug = any($1::text[])`,
      [subSlugs]
    );
    const categoryBySlug = new Map(categoryRows.map((c) => [c.slug, c]));

    const missing = subSlugs.filter((s) => !categoryBySlug.has(s));
    if (missing.length > 0) {
      throw new Error(
        `No encontré estas subcategorías en la base de datos: ${missing.join(", ")}. Revisa /admin/productos/categorias.`
      );
    }

    const created = [];
    for (const subSlug of subSlugs) {
      const category = categoryBySlug.get(subSlug);
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
