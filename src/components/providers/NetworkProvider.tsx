"use client";

import { useState, useSyncExternalStore, type ReactNode } from "react";
import { subscribeToNetworkStatus, getCurrentNetworkStatus } from "@/lib/offline/network-status";
import { NetworkContext, type NetworkContextValue } from "@/contexts/network-context";

interface NetworkProviderProps {
  children: ReactNode;
}

/**
 * Tracks browser online/offline status for `useNetworkStatus`. Pending sync
 * count wiring (`getPendingSyncCount`) is left at its default until the
 * offline sync queue is implemented — see `lib/offline/sync-queue.ts`.
 *
 * `isOnline` is read via `useSyncExternalStore` (rather than `useState` +
 * `useEffect`) since browser online/offline events are exactly the kind of
 * external, subscribable source that hook is designed for.
 */
export function NetworkProvider({ children }: NetworkProviderProps) {
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getCurrentNetworkStatus,
    () => true
  );
  const [{ syncStatus, pendingSyncCount }] = useState<Omit<NetworkContextValue, "isOnline">>({
    syncStatus: "idle",
    pendingSyncCount: 0,
  });

  const value: NetworkContextValue = { isOnline, syncStatus, pendingSyncCount };

  return <NetworkContext value={value}>{children}</NetworkContext>;
}
