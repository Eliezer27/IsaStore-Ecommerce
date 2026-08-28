"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Devuelve `false` durante el render de servidor y la primera pasada de
// hidratación en el cliente, y `true` después de eso. Sirve para mostrar
// valores que vienen de localStorage (carrito, wishlist) sin que el
// servidor y el cliente rendericen cosas distintas en el primer paint
// (hydration mismatch). Usa useSyncExternalStore en vez del patrón
// useState+useEffect(setMounted(true)) porque ese patrón dispara el lint
// rule react-hooks/set-state-in-effect (setState síncrono dentro de un
// efecto, que React desaconseja).
export function useHasMounted() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
