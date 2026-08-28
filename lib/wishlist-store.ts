"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type WishlistItem = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
};

type WishlistState = {
  items: WishlistItem[];
  isWishlisted: (productId: string) => boolean;
  toggle: (item: WishlistItem) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

// Lista de deseos del lado del cliente. Igual que el carrito (ver
// lib/cart-store.ts), vive en localStorage vía zustand/persist. Ya existe
// login real de clientes (ver lib/actions.ts, signIn/signUp con Supabase
// Auth), pero esto no se migró todavía a la tabla `wishlists` de la base de
// datos (que exige un userId) — sigue en localStorage por ahora, sin
// depender de que el cliente tenga sesión iniciada. Cuando se migre, se
// puede hacer sin cambiar cómo lo usan los componentes (mismo shape de
// arriba).
export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      isWishlisted: (productId) =>
        get().items.some((i) => i.productId === productId),
      toggle: (item) => {
        set((state) => {
          const exists = state.items.some((i) => i.productId === item.productId);
          return {
            items: exists
              ? state.items.filter((i) => i.productId !== item.productId)
              : [...state.items, item],
          };
        });
      },
      remove: (productId) => {
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId),
        }));
      },
      clear: () => set({ items: [] }),
    }),
    { name: "isastore-wishlist" }
  )
);
