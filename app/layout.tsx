import type { Metadata } from "next";
import "./globals.css";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";

export const metadata: Metadata = {
  title: "IsaStore — Accesorios y regalos",
  description:
    "Ropa, cadenas y llaveros, peluches y juguetes, collares, maquillaje y accesorios. Envíos en Nicaragua.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <head>
        {/* CSS del template original (IsaWebPlantilla), copiado a /public/assets.
            Se cargan como <link> porque son archivos estáticos, no módulos. */}
        <link rel="stylesheet" href="/assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/assets/css/animate.css" />
        <link rel="stylesheet" href="/assets/css/main.css" />
      </head>
      <body>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
