import type { Metadata } from "next";
import "../globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { getCategoryTree } from "@/lib/categories";

export const metadata: Metadata = {
  title: "IsaStore — Accesorios y regalos",
  description:
    "Ropa, cadenas y llaveros, peluches y juguetes, collares, maquillaje y accesorios. Envíos en Nicaragua.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Se carga una sola vez acá (server component) y se pasa como prop al
  // header y al footer, para no repetir la misma consulta dos veces por
  // página. El header sigue siendo "use client" (necesita useState para los
  // menús), así que recibe las categorías ya resueltas en vez de leerlas él
  // mismo.
  const categories = await getCategoryTree();

  return (
    <html lang="es">
      <head>
        {/* CSS del template original (IsaWebPlantilla), copiado a /public/assets.
            Se cargan como <link> porque son archivos estáticos, no módulos. */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/animate.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
        {/* Iconos Phosphor (clases ph / ph-bold / ph-fill usadas en toda la
            plantilla). El template original los inyectaba con JS
            (assets/js/phosphor-icon.js) desde este mismo CDN; acá se cargan
            directo como <link>, que es más simple y funciona igual con SSR. */}
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/regular/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/bold/style.css" />
        <link rel="stylesheet" href="https://unpkg.com/@phosphor-icons/web@2.1.1/src/fill/style.css" />
      </head>
      <body>
        <SiteHeader categories={categories} />
        <main>{children}</main>
        <SiteFooter categories={categories} />
      </body>
    </html>
  );
}
