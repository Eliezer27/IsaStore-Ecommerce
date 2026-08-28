// Exporta TODOS los productos reales de la base de datos (nombre, sku,
// categoría, subcategoría, si ya tiene imagen) a un CSV, para poder
// generar cosas como una lista de prompts de fotos con datos correctos en
// vez de adivinar qué se creó.
//
// Uso: node scripts/exportar-productos.cjs
// Genera: productos-export.csv (en la raíz del proyecto)
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");
const fs = require("fs");

function csvEscape(value) {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    const { rows } = await pool.query(`
      select
        p.id,
        p.name,
        p.sku,
        p.price,
        p.short_description,
        cat.name as categoria,
        parent.name as categoria_padre,
        (select count(*) from product_images pi where pi.product_id = p.id) as num_imagenes
      from products p
      left join categories cat on cat.id = p.category_id
      left join categories parent on parent.id = cat.parent_id
      order by coalesce(parent.name, cat.name, 'zzz'), cat.name nulls first, p.name
    `);

    const header = [
      "categoria_principal",
      "subcategoria",
      "producto",
      "sku",
      "precio",
      "descripcion_corta",
      "tiene_imagen",
      "product_id",
    ];

    const lines = [header.join(",")];
    for (const r of rows) {
      const categoriaPrincipal = r.categoria_padre || r.categoria || "(sin categoría)";
      const subcategoria = r.categoria_padre ? r.categoria : "";
      lines.push(
        [
          categoriaPrincipal,
          subcategoria,
          r.name,
          r.sku || "",
          r.price,
          r.short_description || "",
          Number(r.num_imagenes) > 0 ? "si" : "no",
          r.id,
        ]
          .map(csvEscape)
          .join(",")
      );
    }

    fs.writeFileSync("productos-export.csv", lines.join("\n"), "utf8");
    console.log(`Se exportaron ${rows.length} productos a productos-export.csv`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
