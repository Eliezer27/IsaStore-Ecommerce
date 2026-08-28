// Barrido de una sola pasada (pero seguro de re-correr): rellena
// Product.description (y Product.attributes cuando aplica) para CUALQUIER
// producto que exista en la base de datos y todavía no tenga una
// descripción larga cargada — sin importar cuándo se haya agregado. Quedaron
// así porque el formulario de /admin/productos no tenía esos campos hasta
// hace poco.
//
// A diferencia de la primera versión de este script (que traía una lista
// fija de SKUs sacada de un CSV exportado en un momento dado), este consulta
// la base de datos EN VIVO cada vez que se corre. Eso importa porque ese CSV
// ya quedó desactualizado apenas se agregaron productos nuevos — dos
// productos reales (un set de pulseras y un bolso) no aparecían ahí para
// nada. Con la consulta en vivo, no importa cuántos productos nuevos se
// agreguen después: este script siempre encuentra los que falten.
//
// Para cada producto sin descripción, en este orden:
//   1. Si su SKU está en KNOWN_BY_SKU (32 productos ya investigados a mano
//      la primera vez, a partir de productos-export.csv), usa esa
//      descripción/especificaciones escritas a mano.
//   2. Si no, pero su nombre está en KNOWN_BY_NAME (casos puntuales
//      confirmados a mano, como estos 2 que no tenían SKU conocido), usa esa.
//   3. Si no, pero el producto ya tiene shortDescription, arma la
//      descripción larga a partir de ESE texto real (no inventa nada) más
//      una frase de cierre según la categoría.
//   4. Si tampoco tiene shortDescription, arma algo mínimo con el nombre y
//      la categoría, y lo deja listado al final como "revisar a mano" —
//      no hay contenido real de dónde partir para ese caso.
//
// Es SEGURO correrlo más de una vez: cada UPDATE solo toca productos cuya
// description está vacía en este momento (where description is null or
// description = ''), así que no pisa nada que el dueño de la tienda ya haya
// escrito a mano desde el dashboard mientras tanto.
//
// Uso: node scripts/backfill-product-descriptions.cjs
require("dotenv").config({ path: ".env.local" });
const { Pool } = require("pg");

// 1) Casos ya investigados a mano por SKU (primera pasada, desde el CSV).
const KNOWN_BY_SKU = [
  {
    sku: "BAS-MAQ-LOR-034",
    description:
      "Base líquida True Match de L'Oréal, cobertura media buildable que se adapta al tono natural de la piel. Acabado natural, ideal para uso diario.",
    attributes: { marca: "L'Oréal", tono: "W1", cobertura: "media" },
  },
  {
    sku: "CJT-DEP-RAY-032",
    description:
      "Conjunto deportivo de dos piezas con detalle de rayas: top cruzado en la espalda y falda plisada de cintura alta. Incluye calcetas deportivas Nike negras.",
    attributes: { piezas: "top + falda", colores: "blanco/negro, rosado/blanco" },
  },
  {
    sku: "CRE-MAQ-BIO-036",
    description:
      "Limpiador facial BIOAQUA con extracto de arroz, formulado para una limpieza profunda del rostro. Presentación de 100g.",
    attributes: { marca: "BIOAQUA", contenido: "100g" },
  },
  {
    sku: "CRE-MAQ-CET-041",
    description:
      "Limpiador facial Cetaphil Gentle Skin Cleanser, fórmula suave pensada para piel sensible. No reseca ni irrita con el uso diario.",
    attributes: { marca: "Cetaphil", tipo_piel: "sensible" },
  },
  {
    sku: "CRE-MAQ-CVE-037",
    description:
      "Limpiador facial en espuma CeraVe, formulado para piel normal a grasa. Ayuda a limpiar sin resecar la piel.",
    attributes: { marca: "CeraVe", tipo_piel: "normal a grasa" },
  },
  {
    sku: "CRE-MAQ-CVL-040",
    description:
      "Loción CeraVe Intensive Moisturizing, hidratación intensa pensada para piel seca. Ideal para uso diario en rostro y cuerpo.",
    attributes: { marca: "CeraVe", tipo_piel: "seca" },
  },
  {
    sku: "CRE-MAQ-MAS-039",
    description:
      "Mascarilla facial en hoja (mask pack) con diseño de Snoopy, pensada para hidratar la piel en minutos. Un capricho de skincare con un toque divertido.",
    attributes: { formato: "hoja (sheet mask)", diseño: "Snoopy" },
  },
  {
    sku: "CRE-MAQ-SAD-038",
    description:
      "Loción hidratante Sadoer con ceramidas, formulada para reforzar la barrera de la piel y mantenerla hidratada.",
    attributes: { marca: "Sadoer", ingrediente_clave: "ceramidas" },
  },
  {
    sku: "DEL-MAQ-LAB-044",
    description:
      "Delineador de labios de punta fina, ideal para definir el contorno antes de aplicar labial o gloss. Disponible en varios tonos.",
    attributes: { tonos: "marrón, rosa, vino, negro" },
  },
  {
    sku: "ENT-DEP-021",
    description:
      "Enterizo deportivo tipo biker con estampado tie-dye y tirantes cruzados en la espalda. Cómodo para entrenar o para un look casual activo.",
    attributes: { colores: "azul, morado, verde olivo" },
  },
  {
    sku: "FAL-DEP-015",
    description:
      "Falda deportiva tipo skater con short interior y cintura alta plisada. Incluye guantes deportivos sin dedos y calcetas Nike negras.",
    attributes: { colores: "negro, beige/topo, rojo, blanco" },
  },
  {
    sku: "GLO-MAQ-LIF-046",
    description:
      "Gloss labial con efecto de volumen (plumping) que da un acabado brillante y labios con más volumen visual. Disponible en varios tonos.",
    attributes: { efecto: "plumping (volumen)" },
  },
  {
    sku: "GLO-MAQ-OLI-047",
    description:
      "Gloss labial tipo jelly de Olibolla, presentado en un frasco decorativo con forma de perfume. Disponible en varios tonos.",
    attributes: { marca: "Olibolla", tipo: "jelly" },
  },
  {
    sku: "LAB-MAQ-MIN-045",
    description:
      "Labial líquido de acabado mate Hold Morning, larga duración para que no tengas que retocarte durante el día. Disponible en varios tonos.",
    attributes: { marca: "Hold Morning", acabado: "mate", duracion: "larga duración" },
  },
  {
    sku: "MAS-MAQ-CLR-049",
    description:
      "Gel fijador transparente Megaclear para cejas y pestañas, mantiene el look en su lugar todo el día sin sentirse pesado.",
    attributes: { uso: "cejas y pestañas", acabado: "transparente" },
  },
  {
    sku: "POL-MAQ-MAY-048",
    description:
      "Polvo compacto Maybelline Fit Me, acabado matificante con cobertura ligera. Ideal para sellar el maquillaje o usar solo.",
    attributes: { marca: "Maybelline", acabado: "matificante", cobertura: "ligera" },
  },
  {
    sku: "PRI-MAQ-MAY-035",
    description:
      "Primer Maybelline Master Prime, minimiza la apariencia de los poros y prepara la piel para una base más duradera. Presentación de 30ml.",
    attributes: { marca: "Maybelline", contenido: "30ml" },
  },
  {
    sku: "TIN-MAQ-BAB-063",
    description:
      "Tinta labial Mocca Lure de larga duración con acabado aterciopelado. Disponible en varios tonos.",
    attributes: { marca: "Mocca Lure", acabado: "aterciopelado" },
  },
  {
    sku: "PIJ-COR-CON-028",
    description:
      "Pijama de 2 piezas: top rosa de tirantes con estampado \"Rabbit\" y short blanco con conejitos y flores. Incluye pantuflas tipo slide a juego con diseño de conejito.",
    attributes: { piezas: "top + short + pantuflas" },
  },
  {
    sku: "PIJ-COR-FRE-030",
    description:
      "Pijama de 2 piezas en negro con estampado de fresitas rojas, top de tirantes con encaje y short a juego. Incluye pantuflas con diseño de Kuromi.",
    attributes: { piezas: "top + short + pantuflas" },
  },
  {
    sku: "PIJ-COR-MOR-024",
    description:
      "Pijama de 2 piezas en morado/lila, top de tirantes con detalle de encaje y botones y short a juego con lazo, en tela acanalada. Incluye pantuflas.",
    attributes: { piezas: "top + short + pantuflas", tela: "acanalada" },
  },
  {
    sku: "PIJ-COR-NEG-029",
    description:
      "Pijama de 2 piezas en satín negro con ribete blanco: camisa tipo botón con bolsillo y short a juego. Incluye pantuflas tipo slide con diseño de fresa en tono lila.",
    attributes: { tela: "satín", piezas: "top + short + pantuflas" },
  },
  {
    sku: "PIJ-LAR-ROS-026",
    description:
      "Pijama de 2 piezas en rosa con estampado de fresas y flores: camisa manga corta y pantalón largo. Incluye pantuflas de peluche con diseño de Stitch y conejo.",
    attributes: { piezas: "camisa + pantalón + pantuflas" },
  },
  {
    sku: "VES-COR-ENC-007",
    description:
      "Vestido corto de encaje blanco con mangas cortas de volantes y falda en capas de dobladillo asimétrico. Estilo romántico.",
    attributes: { tela: "encaje", estilo: "romántico" },
  },
  {
    sku: "VES-COR-SOL-008",
    description:
      "Vestido corto tipo bodycon con estampado boho de soles y lunas en tonos tierra y dorado, tirantes finos y dobladillo festoneado.",
    attributes: { corte: "bodycon", estampado: "boho (soles y lunas)" },
  },
  {
    sku: "VES-LAR-BLA-005",
    description:
      "Vestido blanco de corte suelto con mangas cortas y falda plisada. Fresco y cómodo, fácil de combinar.",
    attributes: { corte: "suelto", falda: "plisada" },
  },
  {
    sku: "VES-LAR-FLO-006",
    description:
      "Vestido midi strapless con estampado floral blanco y negro, silueta entallada y detalle drapeado.",
    attributes: { largo: "midi", escote: "strapless" },
  },
  {
    sku: "VES-LAR-FLR-009",
    description:
      "Vestido largo con escote corazón, diseño drapeado/plisado y estampado floral rosa en acuarela sobre fondo crema.",
    attributes: { escote: "corazón", estampado: "floral acuarela" },
  },
  {
    sku: "VES-LAR-NEG-003",
    description:
      "Vestido largo negro con tirantes finos, escote con abertura y amarre frontal con borlas. Silueta ajustada con abertura lateral, elegante y versátil.",
    attributes: { silueta: "ajustada", detalle: "amarre con borlas" },
  },
  {
    sku: "VES-LAR-ROJ-001",
    description:
      "Vestido largo rojo estilo strapless con abertura lateral. Ideal para eventos y ocasiones especiales.",
    attributes: { escote: "strapless", tallas: "S, M" },
  },
  {
    sku: "VES-LAR-ROS-004",
    description:
      "Vestido largo rosado, silueta ajustada tipo bodycon, con tirantes y cintas largas decorativas que caen al costado.",
    attributes: { corte: "bodycon", detalle: "cintas decorativas" },
  },
  {
    sku: "VES-LAR-VER-002",
    description:
      "Vestido largo verde con estampado floral, tirantes finos y escote en V. Corte entallado, ideal para uso casual o eventos al aire libre.",
    attributes: { escote: "V", corte: "entallado" },
  },
];

// 2) Casos puntuales confirmados a mano cuando no se conocía el SKU (por
// ejemplo, porque el producto se agregó después del último CSV exportado).
// Se matchean por nombre exacto — si el nombre del producto cambia en el
// dashboard, este caso deja de aplicar y el producto cae al punto 3 de
// abajo (se arma desde shortDescription) en vez de romper el script.
const KNOWN_BY_NAME = {
  "Set de Pulseras Perlas Blancas con Dije de Árbol": {
    description:
      "Set de 4 pulseras elásticas con cuentas blancas, nácar y cristal facetado, detalles dorados y dije colgante en forma de corazón con árbol de la vida.",
    attributes: { piezas: "set de 4 pulseras", detalle: "dije árbol de la vida" },
  },
  "Bolso negro con estrellas blancas": {
    description:
      "Bolso negro con estampado de estrellas blancas, un detalle llamativo que le da un toque casual a cualquier outfit.",
    attributes: { estampado: "estrellas blancas" },
  },
};

const KNOWN_BY_SKU_MAP = new Map(KNOWN_BY_SKU.map((item) => [item.sku, item]));

// 3) Frase de cierre según la categoría, para cuando no hay un caso
// confirmado a mano y hay que armar la descripción a partir de la
// shortDescription real del producto (nunca se inventan detalles nuevos,
// solo se agrega una frase de cierre genérica acorde al tipo de producto).
const CLOSING_LINE_BY_KEYWORD = [
  [/ropa|vestido|pijama|blusa|hoodie|falda|short|conjunto|enterizo/i, "Ideal para completar tu look."],
  [/maquillaje|labial|gloss|base|rostro|piel|cejas|pestañas/i, "Perfecto para tu rutina de belleza."],
  [/accesorio|pulsera|anillo|arete|collar|bolso|cartera|lente|gorra|sombrero/i, "Un detalle perfecto para complementar cualquier outfit."],
  [/cadena|llavero/i, "Un accesorio práctico para el día a día."],
  [/peluche|juguete/i, "Ideal para regalar o darte un gusto."],
];

function closingLineFor(categoryName, productName) {
  const haystack = `${categoryName ?? ""} ${productName ?? ""}`;
  const match = CLOSING_LINE_BY_KEYWORD.find(([re]) => re.test(haystack));
  return match ? match[1] : "Un producto pensado para el día a día.";
}

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL no está definida (revisa .env.local)");
  }
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Consulta en vivo: TODOS los productos sin descripción en este momento,
    // sin importar cuándo se hayan agregado.
    const { rows: missing } = await pool.query(
      `select p.id, p.sku, p.name, p.short_description as "shortDescription",
              c.name as "categoryName"
         from products p
         left join categories c on c.id = p.category_id
        where p.description is null or p.description = ''
        order by p.created_at asc`
    );

    const handKnown = [];
    const fromShortDescription = [];
    const noSourceContent = [];

    for (const p of missing) {
      let description;
      let attributes;
      let source;

      const known = (p.sku && KNOWN_BY_SKU_MAP.get(p.sku)) || KNOWN_BY_NAME[p.name];
      if (known) {
        description = known.description;
        attributes = known.attributes ?? {};
        source = "known";
      } else if (p.shortDescription && p.shortDescription.trim()) {
        description = `${p.shortDescription.trim()} ${closingLineFor(p.categoryName, p.name)}`;
        attributes = undefined; // no se toca: no hay info nueva para las specs
        source = "shortDescription";
      } else {
        description = `${p.name}${p.categoryName ? ` — ${p.categoryName}` : ""}. ${closingLineFor(p.categoryName, p.name)}`;
        attributes = undefined;
        source = "none";
      }

      if (attributes !== undefined) {
        await pool.query(
          `update products set description = $1, attributes = $2, updated_at = now() where id = $3`,
          [description, JSON.stringify(attributes), p.id]
        );
      } else {
        await pool.query(
          `update products set description = $1, updated_at = now() where id = $2`,
          [description, p.id]
        );
      }

      const label = `${p.sku ? `[${p.sku}] ` : ""}${p.name}`;
      if (source === "known") handKnown.push(label);
      else if (source === "shortDescription") fromShortDescription.push(label);
      else noSourceContent.push(label);
    }

    const total = handKnown.length + fromShortDescription.length + noSourceContent.length;
    console.log(`\nProductos actualizados: ${total}\n`);

    if (handKnown.length > 0) {
      console.log(`Con descripción investigada a mano — ${handKnown.length}:`);
      handKnown.forEach((l) => console.log(`- ${l}`));
      console.log();
    }
    if (fromShortDescription.length > 0) {
      console.log(`Armados a partir de su descripción corta real — ${fromShortDescription.length}:`);
      fromShortDescription.forEach((l) => console.log(`- ${l}`));
      console.log();
    }
    if (noSourceContent.length > 0) {
      console.log(
        `SIN descripción corta ni datos previos — se les puso algo mínimo, ` +
          `revisar a mano desde /admin cuando se pueda (${noSourceContent.length}):`
      );
      noSourceContent.forEach((l) => console.log(`- ${l}`));
      console.log();
    }

    if (total === 0) {
      console.log("Todos los productos ya tienen descripción — nada que hacer.");
    }
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error("ERROR:", err.message);
  process.exit(1);
});
