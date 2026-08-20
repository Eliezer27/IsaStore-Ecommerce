// Categorías y subcategorías reales de IsaStore, tal como estaban en el
// mega-menú de la plantilla original (index-three.html). Se centralizan acá
// porque el header, el footer, el inicio y /shop las reutilizan.

export type Category = {
  name: string;
  slug: string;
  subcategories: string[];
};

export const CATEGORIES: Category[] = [
  {
    name: "Ropa",
    slug: "ropa",
    subcategories: ["Camisas y Tops", "Pantalones y Faldas", "Vestidos"],
  },
  {
    name: "Cadenas y Llaveros",
    slug: "cadenas-y-llaveros",
    subcategories: ["Cadenas", "Llaveros"],
  },
  {
    name: "Peluches y Juguetes",
    slug: "peluches-y-juguetes",
    subcategories: [
      "Peluches de colección",
      "Figuras decorativas",
      "Almohadas o cojines decorativos en forma de peluche",
    ],
  },
  {
    name: "Collares",
    slug: "collares",
    subcategories: [
      "Choker",
      "Con colgantes",
      "Statement (grandes y llamativos)",
      "Multicapa",
      "Perlas",
      "Minimalistas",
    ],
  },
  {
    name: "Maquillaje",
    slug: "maquillaje",
    subcategories: [
      "Base",
      "Corrector",
      "Sombras de ojos",
      "Máscara de pestañas",
      "Labial o gloss",
    ],
  },
  {
    name: "Accesorios",
    slug: "accesorios",
    subcategories: [
      "Bolsos",
      "Aretes",
      "Pulseras",
      "Anillos",
      "Pinzas",
      "Ligas",
      "Scrunchies",
    ],
  },
];
