import type { Metadata } from "next";
import Script from "next/script";

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

        {/* React 19 no ejecuta un <script> plano puesto directamente en el
            árbol (avisa "Scripts inside React components are never
            executed"). next/script con strategy="beforeInteractive" es la
            forma soportada de cargar JS clásico desde el root layout — y
            solo funciona en el root layout, que es justo dónde está esto.
            El orden se mantiene (jquery antes que lo que depende de
            jquery) porque Next respeta el orden de declaración dentro de
            la misma estrategia. */}
        <Script src="/admin-assets/js/jquery-3.6.0.min.js" strategy="beforeInteractive" />
        {/* feather.min.js se mantiene aunque ya no usamos data-feather
            (ver DashIcon.tsx) porque script.js llama a feather.replace()
            sin guardar con un if — si no está cargado, tira ReferenceError
            y frena el resto de la inicialización (dropdowns, sidebar, etc). */}
        <Script src="/admin-assets/js/feather.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/js/jquery.dataTables.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/js/dataTables.bootstrap4.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/js/bootstrap.bundle.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/plugins/select2/js/select2.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/plugins/sweetalert/sweetalert2.all.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/plugins/sweetalert/sweetalerts.min.js" strategy="beforeInteractive" />
        <Script src="/admin-assets/js/script.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
