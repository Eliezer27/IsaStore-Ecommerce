import type { Metadata } from "next";
import Script from "next/script";
import DataTableInit from "@/components/admin/DataTableInit";

// Root layout aparte del de la tienda (app/(site)/layout.tsx). Next.js
// soporta "multiple root layouts" con route groups: como (admin) y (site)
// son grupos hermanos y ninguno de los dos comparte layout.tsx con el otro,
// cada uno pone su propio <html>/<body> y su propio set de CSS/JS.
//
// Esto es a propósito: la plantilla de admin (Dreamguys/DreamsPOS) trae su
// propio bootstrap.min.css + style.css que NO son compatibles con el
// bootstrap.min.css + main.css de la tienda (mismas clases, reglas
// distintas). Si compartieran layout, uno de los dos se vería roto. Al
// separarlos en root layouts distintos, navegar entre /admin y el resto del
// sitio hace un full page reload — sin overlap de CSS/JS, sin necesidad de
// "scopear" nada.
export const metadata: Metadata = {
  title: "IsaStore — Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/admin-assets/img/icon/ICONO.png" />
        <link rel="stylesheet" href="/admin-assets/css/bootstrap.min.css" />
        <link rel="stylesheet" href="/admin-assets/css/animate.css" />
        <link rel="stylesheet" href="/admin-assets/css/dataTables.bootstrap4.min.css" />
        <link rel="stylesheet" href="/admin-assets/plugins/fontawesome/css/fontawesome.min.css" />
        <link rel="stylesheet" href="/admin-assets/plugins/fontawesome/css/all.min.css" />
        <link rel="stylesheet" href="/admin-assets/plugins/select2/css/select2.min.css" />
        <link rel="stylesheet" href="/admin-assets/css/style.css" />
      </head>
      <body>
        {children}
        <DataTableInit />

        {/* Antes estos <Script> usaban strategy="beforeInteractive". Con
            Next 16 + React 19 eso dispara en el overlay de dev "Encountered
            a script tag while rendering React component" (bug conocido de
            Next/React con beforeInteractive fuera del layout raíz físico
            de app/ — afecta a cualquier uso de beforeInteractive en un
            root layout de route group como este, ver issues de next-themes
            / shadcn-ui / heroui con el mismo mensaje en Next 16.2+). Además,
            beforeInteractive corre ANTES de que React termine de hidratar,
            así que si algo tarda en pintar, jQuery/DataTables podían llegar
            a tocar el DOM a mitad de la hidratación y generar un
            "hydration error" en tablas .datanew/.datatable.
            afterInteractive no tiene ninguna de las dos limitaciones (corre
            después de hidratar, y no pasa por el mecanismo de Script que
            dispara el warning) y sigue respetando el orden de declaración
            entre scripts de la misma estrategia, así que jquery sigue
            cargando antes que todo lo que depende de él. */}
        <Script src="/admin-assets/js/jquery-3.6.0.min.js" strategy="afterInteractive" />
        {/* feather.min.js se mantiene aunque ya no usamos data-feather
            (ver DashIcon.tsx) porque script.js llama a feather.replace()
            sin guardar con un if — si no está cargado, tira ReferenceError
            y frena el resto de la inicialización (dropdowns, sidebar, etc). */}
        <Script src="/admin-assets/js/feather.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/js/jquery.dataTables.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/js/dataTables.bootstrap4.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/js/bootstrap.bundle.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/plugins/select2/js/select2.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/plugins/sweetalert/sweetalert2.all.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/plugins/sweetalert/sweetalerts.min.js" strategy="afterInteractive" />
        <Script src="/admin-assets/js/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
