"use client";

import { useEffect } from "react";
import { useToastStore, type Toast, type ToastType } from "@/lib/toast-store";

// Contenedor de los avisos flotantes. Se monta una sola vez en el layout de
// la tienda (app/(site)/layout.tsx) y escucha el store de toasts. Cada aviso
// se autodescarta a los ~3.2s (el timer vive en <ToastCard/>, atado a su
// mount, para que se limpie solo si el usuario lo cierra antes).

const STYLES: Record<ToastType, { bg: string; icon: string }> = {
  success: { bg: "#16a34a", icon: "ph-fill ph-check-circle" },
  error: { bg: "#dc2626", icon: "ph-fill ph-warning-circle" },
  info: { bg: "#2563eb", icon: "ph-fill ph-info" },
};

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3200);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const style = STYLES[toast.type];

  return (
    <div
      role="status"
      className="flex-align gap-12 text-white rounded-8 px-20 py-16 shadow-lg"
      style={{
        background: style.bg,
        minWidth: 260,
        maxWidth: 360,
        animation: "isastore-toast-in 0.25s ease-out",
      }}
    >
      <i className={`${style.icon} text-2xl d-flex flex-shrink-0`} />
      <span className="fw-medium text-sm flex-grow-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="text-white flex-center flex-shrink-0 border-0 bg-transparent p-0"
        style={{ opacity: 0.85 }}
      >
        <i className="ph ph-x text-lg d-flex" />
      </button>
    </div>
  );
}

export default function Toaster() {
  const toasts = useToastStore((state) => state.toasts);
  const dismiss = useToastStore((state) => state.dismiss);

  return (
    <>
      <style>{`
        @keyframes isastore-toast-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div
        aria-live="polite"
        style={{
          position: "fixed",
          top: 24,
          right: 24,
          zIndex: 3000,
          display: "flex",
          flexDirection: "column",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        {toasts.map((toast) => (
          <div key={toast.id} style={{ pointerEvents: "auto" }}>
            <ToastCard toast={toast} onDismiss={() => dismiss(toast.id)} />
          </div>
        ))}
      </div>
    </>
  );
}
