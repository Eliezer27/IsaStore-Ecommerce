"use client";

// Botón simple para imprimir la página actual (usado en la "factura" de
// /admin/ventas/[id]). No genera un PDF aparte — usa el diálogo de
// impresión del propio navegador (que ya deja guardar como PDF si hace
// falta), apoyado en las reglas @media print de esa página para ocultar el
// header/sidebar del admin y que solo salga el contenido del pedido.
export default function PrintButton() {
  return (
    <button
      type="button"
      className="btn btn-added no-print"
      onClick={() => window.print()}
    >
      <img src="/admin-assets/img/icons/printer.svg" alt="" className="me-1" />
      Imprimir
    </button>
  );
}
