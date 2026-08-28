// Script de una sola vez: crea 4 productos para cada una de las 6
// subcategorías de Accesorios: Aretes, Pulseras, Anillos,
// Bolsos / Carteras pequeñas, Gorras / Sombreros y Lentes de sol
// (24 productos en total).
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-accesorios-subcategorias.cjs
//
// No es idempotente a propósito: si lo corrés dos veces, crea otra tanda
// de 24 productos (el slug se genera con un sufijo aleatorio para que
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
  Aretes: [
    {
      name: "Aretes Argolla Dorados",
      sku: "ACC-AR-001",
      price: 190,
      stock: 25,
      shortDescription: "Aretes tipo argolla, acabado dorado.",
      description:
        "Aretes tipo argolla con acabado dorado antialérgico. Livianos y cómodos para uso diario, combinan con cualquier outfit.",
      attributes: { material: "acero dorado" },
    },
    {
      name: "Aretes Perla Clásicos",
      sku: "ACC-AR-002",
      price: 170,
      stock: 22,
      shortDescription: "Aretes clásicos con perla, tipo stud.",
      description:
        "Aretes tipo stud con perla sintética central, diseño clásico y elegante. Cierre de mariposa, antialérgico.",
      attributes: { material: "acero", detalle: "perla sintética" },
    },
    {
      name: "Aretes Colgantes Geométricos",
      sku: "ACC-AR-003",
      price: 210,
      stock: 18,
      shortDescription: "Aretes colgantes con diseño geométrico.",
      description:
        "Aretes colgantes de diseño geométrico moderno, acabado dorado mate. Livianos, ideales para looks de día o noche.",
      attributes: { material: "acero dorado", estilo: "geométrico" },
    },
    {
      name: "Aretes Mini Stud Set x3",
      sku: "ACC-AR-004",
      price: 160,
      stock: 20,
      shortDescription: "Set de 3 pares de aretes mini stud.",
      description:
        "Set de 3 pares de aretes mini tipo stud en distintos diseños, ideales para combinar varios piercings en la misma oreja.",
      attributes: { material: "acero", piezas: "3 pares" },
    },
  ],
  Pulseras: [
    {
      name: "Pulsera Cadena Fina Dorada",
      sku: "ACC-PU-001",
      price: 180,
      stock: 22,
      shortDescription: "Pulsera de cadena fina, acabado dorado.",
      description:
        "Pulsera de cadena fina con acabado dorado antialérgico, cierre de mosquetón ajustable. Ideal para uso diario o combinar en capas.",
      attributes: { material: "acero dorado" },
    },
    {
      name: "Pulsera de Dijes Personalizable",
      sku: "ACC-PU-002",
      price: 220,
      stock: 16,
      shortDescription: "Pulsera base para agregar dijes.",
      description:
        "Pulsera base de cadena resistente pensada para ir agregando dijes con el tiempo. Cierre ajustable, acabado plateado.",
      attributes: { material: "acero", estilo: "personalizable" },
    },
    {
      name: "Pulsera Trenzada de Cuero",
      sku: "ACC-PU-003",
      price: 150,
      stock: 24,
      shortDescription: "Pulsera trenzada en cuero sintético.",
      description:
        "Pulsera trenzada en cuero sintético con cierre magnético, estilo casual unisex. Resistente al uso diario.",
      attributes: { material: "cuero sintético" },
    },
    {
      name: "Pulsera Ajustable de Charms",
      sku: "ACC-PU-004",
      price: 200,
      stock: 18,
      shortDescription: "Pulsera ajustable con varios charms colgantes.",
      description:
        "Pulsera de cadena ajustable con varios charms colgantes (estrellas, corazones). Cierre deslizante para ajustar el tamaño.",
      attributes: { material: "acero dorado", detalle: "charms" },
    },
  ],
  Anillos: [
    {
      name: "Anillo Ajustable Minimalista",
      sku: "ACC-AN-001",
      price: 140,
      stock: 25,
      shortDescription: "Anillo minimalista, talla ajustable.",
      description:
        "Anillo de diseño minimalista con banda ajustable, se adapta a distintos tamaños de dedo. Acabado antialérgico.",
      attributes: { material: "acero", talla: "ajustable" },
    },
    {
      name: "Set de Anillos Apilables x3",
      sku: "ACC-AN-002",
      price: 210,
      stock: 18,
      shortDescription: "Set de 3 anillos finos para apilar.",
      description:
        "Set de 3 anillos finos pensados para usar juntos o por separado (efecto stacking). Distintos diseños en el mismo tono dorado.",
      attributes: { material: "acero dorado", piezas: 3 },
    },
    {
      name: "Anillo con Piedra Central",
      sku: "ACC-AN-003",
      price: 230,
      stock: 15,
      shortDescription: "Anillo con piedra sintética central.",
      description:
        "Anillo con piedra sintética central engarzada, banda delgada de acabado plateado. Ideal como accesorio statement discreto.",
      attributes: { material: "acero", detalle: "piedra sintética" },
    },
    {
      name: "Anillo Trenzado Dorado",
      sku: "ACC-AN-004",
      price: 170,
      stock: 20,
      shortDescription: "Anillo con diseño trenzado, acabado dorado.",
      description:
        "Anillo de banda trenzada con acabado dorado, diseño texturizado que le da un toque distinto a un anillo básico.",
      attributes: { material: "acero dorado", estilo: "trenzado" },
    },
  ],
  "Bolsos / Carteras pequeñas": [
    {
      name: "Cartera Pequeña de Mano",
      sku: "ACC-BC-001",
      price: 480,
      stock: 12,
      shortDescription: "Cartera pequeña de mano con cierre superior.",
      description:
        "Cartera pequeña de mano con cierre superior tipo clutch, compartimento principal e interior con bolsillo para tarjetas.",
      attributes: { material: "sintético", cierre: "clutch" },
    },
    {
      name: "Bolso Cruzado Mini",
      sku: "ACC-BC-002",
      price: 550,
      stock: 14,
      shortDescription: "Bolso cruzado mini, correa ajustable.",
      description:
        "Bolso cruzado tamaño mini con correa ajustable y desmontable. Compartimento principal con cierre y bolsillo frontal.",
      attributes: { material: "sintético", correa: "ajustable" },
    },
    {
      name: "Cartera Tipo Sobre",
      sku: "ACC-BC-003",
      price: 420,
      stock: 16,
      shortDescription: "Cartera tipo sobre, ideal para looks de noche.",
      description:
        "Cartera tipo sobre con solapa y cierre magnético, correa de cadena desmontable. Ideal para llevar lo esencial en salidas de noche.",
      attributes: { material: "sintético", estilo: "sobre" },
    },
    {
      name: "Bolso Bandolera Compacto",
      sku: "ACC-BC-004",
      price: 590,
      stock: 10,
      shortDescription: "Bolso bandolera compacto, varios compartimentos.",
      description:
        "Bolso bandolera de tamaño compacto con varios compartimentos internos y correa ajustable. Práctico para el día a día.",
      attributes: { material: "sintético", compartimentos: "múltiples" },
    },
  ],
  "Gorras / Sombreros": [
    {
      name: "Gorra Trucker Unisex",
      sku: "ACC-GS-001",
      price: 350,
      stock: 20,
      shortDescription: "Gorra trucker unisex, malla trasera.",
      description:
        "Gorra estilo trucker con panel frontal y malla trasera transpirable. Cierre ajustable tipo snapback, unisex.",
      attributes: { material: "poliéster/malla", ajuste: "snapback" },
    },
    {
      name: "Sombrero de Playa Ala Ancha",
      sku: "ACC-GS-002",
      price: 420,
      stock: 14,
      shortDescription: "Sombrero de ala ancha para playa o sol.",
      description:
        "Sombrero de ala ancha en fibra tejida, ideal para protegerse del sol en la playa o el día a día. Copa cómoda y ligera.",
      attributes: { material: "fibra tejida", estilo: "ala ancha" },
    },
    {
      name: "Gorra Snapback Bordada",
      sku: "ACC-GS-003",
      price: 380,
      stock: 18,
      shortDescription: "Gorra snapback con bordado frontal.",
      description:
        "Gorra snapback de perfil alto con bordado frontal, visera plana. Cierre trasero ajustable tipo snap.",
      attributes: { material: "algodón", ajuste: "snapback" },
    },
    {
      name: "Sombrero Panamá Clásico",
      sku: "ACC-GS-004",
      price: 460,
      stock: 12,
      shortDescription: "Sombrero estilo Panamá, cinta decorativa.",
      description:
        "Sombrero estilo Panamá tejido a mano con cinta decorativa alrededor de la copa. Ligero y transpirable, buen complemento para looks de verano.",
      attributes: { material: "fibra tejida", estilo: "panamá" },
    },
  ],
  "Lentes de sol": [
    {
      name: "Lentes de Sol Retro",
      sku: "ACC-LS-001",
      price: 420,
      stock: 16,
      shortDescription: "Lentes de sol estilo retro con protección UV.",
      description:
        "Lentes de sol de armazón estilo retro con protección UV400. Incluyen funda para transportarlos sin rayarlos.",
      attributes: { proteccion: "UV400", estilo: "retro" },
    },
    {
      name: "Lentes de Sol Aviador",
      sku: "ACC-LS-002",
      price: 450,
      stock: 15,
      shortDescription: "Lentes de sol estilo aviador, marco metálico.",
      description:
        "Lentes de sol estilo aviador con marco metálico y lentes con protección UV400. Diseño clásico unisex.",
      attributes: { proteccion: "UV400", estilo: "aviador" },
    },
    {
      name: "Lentes de Sol Ojo de Gato",
      sku: "ACC-LS-003",
      price: 400,
      stock: 18,
      shortDescription: "Lentes de sol estilo ojo de gato.",
      description:
        "Lentes de sol con armazón estilo ojo de gato, protección UV400. Un toque vintage y femenino para cualquier outfit.",
      attributes: { proteccion: "UV400", estilo: "ojo de gato" },
    },
    {
      name: "Lentes de Sol Deportivos",
      sku: "ACC-LS-004",
      price: 380,
      stock: 20,
      shortDescription: "Lentes de sol deportivos, marco envolvente.",
      description:
        "Lentes de sol con marco envolvente tipo deportivo, ideales para actividades al aire libre. Protección UV400 y buen agarre.",
      attributes: { proteccion: "UV400", estilo: "deportivo" },
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
