"use client";

// Confirm nativo del navegador en vez del modal de SweetAlert2 que trae la
// plantilla original (".confirm-text" + script.js): en el HTML original ese
// modal solo era decorativo (no borraba nada de verdad, era una demo).
// Acá el borrado sí pega a la base de datos, así que se prioriza que el
// confirm sea confiable y simple sobre que sea bonito. Se puede reemplazar
// por SweetAlert2 más adelante si se quiere, envolviendo este mismo submit.

export default function DeleteButton({
  id,
  action,
  confirmLabel,
}: {
  id: string;
  action: (formData: FormData) => void | Promise<void>;
  confirmLabel: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmLabel)) {
          e.preventDefault();
        }
      }}
      style={{ display: "inline" }}
    >
      <input type="hidden" name="id" value={id} />
      <button type="submit" className="border-0 bg-transparent p-0">
        <img src="/admin-assets/img/icons/delete.svg" alt="Eliminar" />
      </button>
    </form>
  );
}
