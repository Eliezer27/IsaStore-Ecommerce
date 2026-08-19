// Tipos ligeros compartidos entre server components y client components.
// Se definen a mano (en vez de usar los tipos completos de Prisma) para que
// los client components no tengan que importar @prisma/client.

export type ProductCard = {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  image: string | null;
  ratingAvg: number;
  ratingCount: number;
};

export type ProductDetail = ProductCard & {
  shortDescription: string | null;
  description: string | null;
  stock: number;
  images: { url: string; alt: string | null }[];
  category: { name: string; slug: string } | null;
};
