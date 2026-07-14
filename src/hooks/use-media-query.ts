"use client";

import { useSyncExternalStore } from "react";

/**
 * Tracks whether a CSS media query currently matches. Used to switch
 * between `BottomNavigation` (mobile) and `DesktopSidebar` (larger
 * viewports) without duplicating breakpoint logic in every consumer.
 *
 * Implemented with `useSyncExternalStore` (rather than
 * `useState` + `useEffect`) since a browser media query is exactly the kind
 * of external, subscribable source that hook is designed for, and it avoids
 * synchronously calling a state setter inside an effect body.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === "undefined") return () => {};
      const mediaQueryList = window.matchMedia(query);
      mediaQueryList.addEventListener("change", onStoreChange);
      return () => mediaQueryList.removeEventListener("change", onStoreChange);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia(query).matches),
    () => false
  );
}
