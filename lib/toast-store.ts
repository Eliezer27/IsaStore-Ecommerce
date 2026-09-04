"use client";

import { create } from "zustand";

// Notificaciones tipo "toast" (avisos flotantes): "Producto añadido al
// carrito", "Producto eliminado", etc. Vive en un store de Zustand (sin
// persist — los avisos son efímeros) para poder dispararlos desde cualquier
// componente cliente, y también desde código que no es un hook, vía el helper
// notify() de más abajo (useToastStore.getState()).

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: number;
  message: string;
  type: ToastType;
};

type ToastState = {
  toasts: Toast[];
  notify: (message: string, type?: ToastType) => void;
  dismiss: (id: number) => void;
};

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  notify: (message, type = "success") => {
    // id único aunque se disparen dos avisos en el mismo milisegundo.
    const id = Date.now() + Math.random();
    set((state) => ({ toasts: [...state.toasts, { id, message, type }] }));
  },
  dismiss: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

/** Atajo para disparar un aviso desde cualquier lado (incluido código que no
 * es un componente/hook), sin tener que suscribirse al store. */
export function notify(message: string, type: ToastType = "success") {
  useToastStore.getState().notify(message, type);
}
