"use client";

import { useNetworkContext } from "@/contexts/network-context";

/**
 * Convenience re-export of `useNetworkContext` under the app's general
 * `hooks/` folder, matching where other cross-cutting hooks live. Prefer
 * this in components over importing the context directly.
 */
export function useNetworkStatus() {
  return useNetworkContext();
}
