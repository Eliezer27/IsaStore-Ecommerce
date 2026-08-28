// Script de una sola vez: crea hasta 5 productos "de relleno" repartidos
// entre las categorías (de las 6 principales) que todavía no tienen NINGÚN
// producto — ni en la categoría misma ni en sus subcategorías.
//
// Todos los campos (nombre, slug, sku, precio, stock, descripción corta,
// descripción larga, atributos) quedan llenos con datos de ejemplo
// razonables. A propósito NO se sube ninguna imagen: cada producto queda
// creado "sin imagen" para que la agregues manualmente después desde
// /admin/productos -> editar (ahí ya existe el campo para subir el
// archivo o pegar una URL).
//
// Uso: node scripts/seed-empty-categories.cjs
//
// Reglas:
//   - Detecta categorías vacías en el momento de correr (cuenta productos
//     de la categoría padre + todas sus subcategorías).
//   - Reparte los 5 productos en orden round-robin entre las categorías
//     vacías (1 por categoría en la primera vuelta, hasta 2 por categoría
//     si sobran cupos y quedan pocas categorías vacías).
//   - Si TODAS las categorías principales ya tienen productos, no crea
//     nada y lo avisa.
//   - No es idempotente a propósito: si lo corrés dos veces, crea otra
//     tanda de productos (útil si agregaste categorías nuevas después).
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

// Orden fijo en el que se van repartiendo los 5 productos entre las
// categorías vacías (mismo orden que lib/categories.ts).
const PARENT_ORDER = [
  "ropa",
  "cadenas-y-llaveros",
  "peluches-y-juguetes",
  "collares",
  "maquillaje",
  "accesorios",
];

// Hasta 2 productos candidatos por categoría principal. `subSlug: null`
// significa "usar la categoría padre directamente" (caso de Collares, que
// no tiene subcategorías).
const CANDIDATES = {
  ropa: [
    {
      subSlug: "camisas-blusas",
      name: "Blusa Casual Manga Larga",
      sku: "ROP-BLU-001",
      price: 450,
      stock: 20,
      shortDescription: "Blusa cómoda de manga larga, ideal para el día a día.",
      description:
        "Blusa casual de manga larga confeccionada en tela suave y liviana. Corte versátil que combina fácil con jeans o faldas. Disponible en varias tallas.",
      attributes: { material: "algodón", manga: "larga" },
    },
    {
      subSlug: "sudaderas-hoodies",
      name: "Hoodie Oversize Unisex",
      sku: "ROP-HOO-001",
      price: 650,
      stock: 15,
      shortDescription: "Hoodie oversize unisex, capucha con cordón ajustable.",
      description:
        "Sudadera con capucha de corte oversize, tela afelpada por dentro para más abrigo. Bolsillo tipo canguro al frente y cordón ajustable en la capucha. Unisex.",
      attributes: { material: "algodón/poliéster", corte: "oversize" },
    },
  ],
  "cadenas-y-llaveros": [
    {
      subSlug: "llaveros-tematicos",
      name: "Llavero Metálico Anime Chibi",
      sku: "CAD-LLA-001",
      price: 120,
      stock: 30,
      shortDescription: "Llavero metálico temático, diseño chibi.",
      description:
        "Llavero de metal con acabado esmaltado y diseño temático estilo chibi. Incluye argolla resistente para colgar de mochila o llaves.",
      attributes: { material: "metal esmaltado" },
    },
    {
      subSlug: "cadenas-cartera-mochila",
      name: "Cadena Decorativa para Mochila",
      sku: "CAD-CAD-001",
      price: 180,
      stock: 25,
      shortDescription: "Cadena decorativa con mosquetones en ambos extremos.",
      description:
        "Cadena metálica decorativa con mosquetón en cada extremo, fácil de enganchar a mochilas, carteras o pantalones. Acabado plateado resistente al uso diario.",
      attributes: { material: "metal", largo_cm: 60 },
    },
  ],
  "peluches-y-juguetes": [
    {
      subSlug: "peluches",
      name: "Peluche Oso Abrazable 30cm",
      sku: "PEL-OSO-001",
      price: 380,
      stock: 18,
      shortDescription: "Peluche de oso suave, 30cm, ideal para regalar.",
      description:
        "Peluche de oso ultra suave de 30cm de alto, relleno hipoalergénico. Perfecto como regalo o para decorar la cama o el cuarto.",
      attributes: { material: "felpa", alto_cm: 30 },
    },
    {
      subSlug: "figuras-coleccionables",
      name: "Figura Coleccionable Kawaii",
      sku: "PEL-FIG-001",
      price: 250,
      stock: 20,
      shortDescription: "Figura coleccionable estilo kawaii, PVC de alta calidad.",
      description:
        "Figura coleccionable de PVC con acabado pintado a detalle, estilo kawaii. Tamaño ideal para exhibir en escritorio o repisa.",
      attributes: { material: "PVC" },
    },
  ],
  collares: [
    {
      subSlug: null,
      name: "Collar Choker Minimalista",
      sku: "COL-CHO-001",
      price: 220,
      stock: 25,
      shortDescription: "Collar tipo choker, diseño minimalista.",
      description:
        "Collar corto tipo choker de diseño minimalista, acabado antialérgico. Se ajusta con cierre de broche, cómodo para uso diario.",
      attributes: { material: "acero inoxidable" },
    },
    {
      subSlug: null,
      name: "Collar con Dije de Luna",
      sku: "COL-LUN-001",
      price: 280,
      stock: 20,
      shortDescription: "Collar largo con dije de luna.",
      description:
        "Collar de cadena fina con dije en forma de luna. Cadena ajustable y acabado antialérgico, ideal para uso diario o de regalo.",
      attributes: { material: "acero inoxidable", dije: "luna" },
    },
  ],
  maquillaje: [
    {
      subSlug: "labios",
      name: "Set de Labiales Mate x3",
      sku: "MAQ-LAB-001",
      price: 340,
      stock: 22,
      shortDescription: "Set de 3 labiales mate de larga duración.",
      description:
        "Set de 3 labiales líquidos de acabado mate y larga duración, en tonos versátiles para el día a día. Fórmula ligera, no reseca los labios.",
      attributes: { acabado: "mate", piezas: 3 },
    },
    {
      subSlug: "kits-sets",
      name: "Kit de Maquillaje Básico",
      sku: "MAQ-KIT-001",
      price: 590,
      stock: 12,
      shortDescription: "Kit básico de maquillaje para iniciar tu rutina.",
      description:
        "Kit de maquillaje básico con lo esencial para rostro, ojos y labios. Ideal para quienes están empezando o buscan algo compacto para viajar.",
      attributes: { piezas: "múltiples" },
    },
  ],
  accesorios: [
    {
      subSlug: "aretes",
      name: "Aretes Argolla Dorados",
      sku: "ACC-ARE-001",
      price: 190,
      stock: 30,
      shortDescription: "Aretes tipo argolla, acabado dorado.",
      description:
        "Aretes tipo argolla con acabado dorado antialérgico. Livianos y cómodos para uso diario, combinan con cualquier outfit.",
      attributes: { material: "acero dorado" },
    },
    {
      subSlug: "lentes-de-sol",
      name: "Lentes de Sol Retro",
      sku: "ACC-LEN-001",
      price: 420,
      stock: 16,
      shortDescription: "Lentes de sol estilo retro con protección UV.",
      description:
        "Lentes de sol de armazón estilo retro con protección UV400. Incluyen funda para transportarlos sin rayarlos.",
      attributes: { proteccion: "UV400" },
    },
  ],
};

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows: categoryRows } = await pool.query(
      `select c.id, c.slug, c.name, c.parent_id, p.slug as parent_slug
       from categories c
       left join categories p on p.id = c.parent_id
       order by c.parent_id nulls first, c.position`
    );

    const { rows: countRows } = await pool.query(
      `select category_id, count(*)::int as n from products group by category_id`
    );
    const countByCategoryId = new Map(
      countRows.map((r) => [r.category_id, r.n])
    );

    const parents = categoryRows.filter((c) => !c.parent_id);
    const childrenByParentId = new Map();
    for (const c of categoryRows) {
      if (c.parent_id) {
        if (!childrenByParentId.has(c.parent_id)) childrenByParentId.set(c.parent_id, []);
        childrenByParentId.get(c.parent_id).push(c);
      }
    }

    const parentBySlug = new Map(parents.map((p) => [p.slug, p]));

    const emptyParentSlugs = [];
    for (const p of parents) {
      const children = childrenByParentId.get(p.id) ?? [];
      const total =
        (countByCategoryId.get(p.id) ?? 0) +
        children.reduce((sum, ch) => sum + (countByCategoryId.get(ch.id) ?? 0), 0);
      if (total === 0) emptyParentSlugs.push(p.slug);
    }

    if (emptyParentSlugs.length === 0) {
      console.log(
        "Todas las categorías principales ya tienen al menos un producto. No se creó nada."
      );
      return;
    }

    console.log("Categorías vacías detectadas:", emptyParentSlugs.join(", "));

    // Reparte hasta 5 productos en round-robin: primero un candidato por
    // cada categoría vacía (en PARENT_ORDER), y si sobra cupo, un segundo
    // candidato por categoría, hasta llegar a 5 o agotar los candidatos.
    const selected = [];
    for (let round = 0; round < 2 && selected.length < 5; round++) {
      for (const slug of PARENT_ORDER) {
        if (selected.length >= 5) break;
        if (!emptyParentSlugs.includes(slug)) continue;
        const candidate = CANDIDATES[slug]?.[round];
        if (!candidate) continue;
        selected.push({ parentSlug: slug, ...candidate });
      }
    }

    const created = [];
    for (const item of selected) {
      const parent = parentBySlug.get(item.parentSlug);
      let categoryId = parent.id;
      if (item.subSlug) {
        const children = childrenByParentId.get(parent.id) ?? [];
        const sub = children.find((ch) => ch.slug === item.subSlug);
        if (sub) categoryId = sub.id;
      }

      const suffix = crypto.randomBytes(3).toString("hex");
      const slug = `${slugify(item.name)}-${suffix}`;

      const { rows } = await pool.query(
        `insert into products
           (category_id, name, slug, sku, short_description, description,
            price, stock, attributes, is_active)
         values ($1,$2,$3,$4,$5,$6,$7,$8,$9,true)
         returning id, name, slug`,
        [
          categoryId,
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
      created.push(rows[0]);
    }

    console.log(`\nSe crearon ${created.length} producto(s) SIN imagen:\n`);
    for (const p of created) {
      console.log(
        `- ${p.name}\n  editar/subir imagen: http://localhost:3000/admin/productos/${p.id}/editar\n`
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
