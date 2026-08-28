"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// El admin usa jQuery DataTables (plantilla DreamsPOS) sobre las tablas de
// listado (".datanew" con buscador/orden/paginado, ".datatable" solo con
// orden/paginado). public/admin-assets/js/script.js las inicializa UNA
// sola vez, cuando corre el <Script strategy="afterInteractive"> del
// layout de /admin (ver app/(admin)/layout.tsx).
//
// El problema: cualquier navegación DENTRO de /admin después de esa carga
// inicial (por ejemplo, el redirect() de createProduct de vuelta a
// /admin/productos al guardar un producto nuevo) es una transición
// client-side de Next — la tabla se vuelve a renderizar desde cero, pero
// jQuery/DataTables nunca se vuelve a correr sobre ella, así que el
// buscador (y el resto de los controles de DataTables) desaparecen.
//
// Este componente, montado una vez en el layout de /admin, re-inicializa
// DataTables cada vez que cambia la ruta, destruyendo cualquier instancia
// previa sobre la misma tabla para no chocar con "Cannot reinitialise
// DataTable".
export default function DataTableInit() {
  const pathname = usePathname();

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    function init() {
      if (cancelled) return;

      // jQuery y el plugin DataTables (public/admin-assets/js/*.min.js) no
      // traen tipos; se acceden como globals sin tipar a propósito.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jq = (window as unknown as { jQuery?: any }).jQuery;
      if (!jq || !jq.fn || !jq.fn.DataTable) {
        // jQuery/DataTables (cargados como Script afterInteractive) puede
        // no estar listo todavía, sobre todo en la carga inicial de la
        // página — reintenta unas cuantas veces antes de rendirse.
        if (attempts++ < 40) {
          setTimeout(init, 100);
        }
        return;
      }

      const reinit = (selector: string, options: Record<string, unknown>) => {
        const $table = jq(selector);
        if ($table.length === 0) return;
        if (jq.fn.DataTable.isDataTable($table)) {
          $table.DataTable().destroy();
        }
        $table.DataTable(options);
      };

      reinit(".datanew", {
        bFilter: true,
        sDom: "fBtlpi",
        pagingType: "numbers",
        ordering: true,
        language: {
          search: " ",
          sLengthMenu: "_MENU_",
          searchPlaceholder: "Search...",
          info: "_START_ - _END_ of _TOTAL_ items",
        },
        initComplete: () => {
          jq(".dataTables_filter").appendTo("#tableSearch");
          jq(".dataTables_filter").appendTo(".search-input");
        },
      });

      reinit(".datatable", { bFilter: false });
    }

    init();

    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return null;
}
