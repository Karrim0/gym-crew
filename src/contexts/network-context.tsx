"use client";

import { createContext, useContext } from "react";
import type { SyncStatus } from "@/types";

export interface NetworkContextValue {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
}

export const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

/**
 * Access online/offline status and pending-sync info. Must be used within
 * `NetworkProvider` (see `components/providers/NetworkProvider.tsx`).
 */
export function useNetworkContext(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkContext must be used within NetworkProvider.");
  }
  return context;
}
