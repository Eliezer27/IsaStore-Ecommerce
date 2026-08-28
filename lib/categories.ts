import { prisma } from "@/lib/prisma";

// Categorías y subcategorías reales de IsaStore.
//
// Regla usada para decidir en qué categoría cae cada producto (evita que un
// mismo tipo de producto pueda caer en dos categorías a la vez):
//   - ¿Se usa en el cuello?              -> Collares
//   - ¿Es para un objeto (cartera,
//     llaves, pantalón)?                 -> Cadenas y Llaveros
//   - ¿Es cualquier otro accesorio
//     de vestir (no cuello)?             -> Accesorios
//
// Se mantienen entre 4 y 6 subcategorías por categoría (Collares queda sin
// subdividir a propósito) y no se agrega una subcategoría nueva hasta tener
// inventario suficiente para justificarla.
//
// Este arreglo es el "default" estático: se usa como fallback si todavía no
// hay base de datos conectada (o está vacía), y es también la fuente que
// espeja scripts/seed-categories.cjs para poblar la tabla `categories` real
// (con jerarquía padre/hijo vía `parent_id`). Una vez la base de datos tiene
// estas filas, getCategoryTree() lee de ahí — así el admin puede agregar,
// renombrar o borrar categorías/subcategorías desde el dashboard sin tocar
// código.

export type Subcategory = {
  name: string;
  slug: string;
};

export type Category = {
  name: string;
  slug: string;
  subcategories: Subcategory[];
};

export const CATEGORIES: Category[] = [
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
    // Sin subcategorías: queda como categoría única a propósito.
    subcategories: [],
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

/**
 * Árbol de categorías (padre + subcategorías) para usar en el header, el
 * footer y el filtro de /shop. Lee de la base de datos (tabla `categories`,
 * jerarquía por `parent_id`) para que lo que se cree/edite desde
 * /admin/productos/categorias se refleje en el sitio real. Si la base de
 * datos no está conectada o todavía no tiene categorías, cae de vuelta al
 * árbol estático de arriba para que el sitio nunca se quede sin navegación.
 */
export async function getCategoryTree(): Promise<Category[]> {
  try {
    const rows = await prisma.category.findMany({
      where: { parentId: null, isActive: true },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ position: "asc" }, { name: "asc" }],
        },
      },
      orderBy: [{ position: "asc" }, { name: "asc" }],
    });

    if (rows.length === 0) {
      return CATEGORIES;
    }

    return rows.map((cat) => ({
      name: cat.name,
      slug: cat.slug,
      subcategories: cat.children.map((sub) => ({
        name: sub.name,
        slug: sub.slug,
      })),
    }));
  } catch (err) {
    console.warn(
      "[categories] no se pudo cargar el árbol desde la base de datos, usando el default estático:",
      err instanceof Error ? err.message : err
    );
    return CATEGORIES;
  }
}
