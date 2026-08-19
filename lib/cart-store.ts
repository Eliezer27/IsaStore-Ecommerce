"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartState = {
  lines: CartLine[];
  addItem: (item: Omit<CartLine, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
  totalItems: () => number;
  totalPrice: () => number;
};

// Carrito del lado del cliente. Por ahora vive en localStorage (vía
// zustand/persist) para que sobreviva a un refresh sin necesitar login.
// Cuando se conecte la base de datos, esto se puede sincronizar con las
// tablas carts / cart_items para carritos de usuarios logueados.
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],
      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.lines.find((l) => l.productId === item.productId);
          if (existing) {
            return {
              lines: state.lines.map((l) =>
                l.productId === item.productId
                  ? { ...l, quantity: l.quantity + quantity }
                  : l
              ),
            };
          }
          return { lines: [...state.lines, { ...item, quantity }] };
        });
      },
      removeItem: (productId) => {
        set((state) => ({
          lines: state.lines.filter((l) => l.productId !== productId),
        }));
      },
      setQuantity: (productId, quantity) => {
        set((state) => ({
          lines: state.lines
            .map((l) => (l.productId === productId ? { ...l, quantity } : l))
            .filter((l) => l.quantity > 0),
        }));
      },
      clear: () => set({ lines: [] }),
      totalItems: () => get().lines.reduce((sum, l) => sum + l.quantity, 0),
      totalPrice: () => get().lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
    }),
    { name: "isastore-cart" }
  )
);
