"use client";

import { createContext, useContext } from "react";
import type { SyncStatus } from "@/types";

export interface NetworkContextValue {
  isOnline: boolean;
  syncStatus: SyncStatus;
  pendingSyncCount: number;
  lastSyncError: string | null;
  retrySync: () => Promise<void>;
  refreshSyncState: () => Promise<void>;
}

export const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function useNetworkContext(): NetworkContextValue {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetworkContext must be used within NetworkProvider.");
  }
  return context;
}
