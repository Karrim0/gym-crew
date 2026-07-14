"use client";

import { useCallback, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { NetworkContext } from "@/contexts/network-context";
import { SYNC_INTERVAL_MS } from "@/lib/constants";
import {
  getCurrentNetworkStatus,
  getPendingSyncCount,
  processSyncQueue,
  retryFailedSyncItems,
  subscribeToNetworkStatus,
  subscribeToSyncQueueChanges,
} from "@/lib/offline";
import type { SyncStatus } from "@/types";

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const isOnline = useSyncExternalStore(
    subscribeToNetworkStatus,
    getCurrentNetworkStatus,
    () => true,
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [lastSyncError, setLastSyncError] = useState<string | null>(null);

  const refreshSyncState = useCallback(async () => {
    const count = await getPendingSyncCount();
    setPendingSyncCount(count);
    if (count === 0) {
      setSyncStatus((current) => (current === "syncing" ? current : "synced"));
    }
  }, []);

  const runSync = useCallback(async (retry = false) => {
    if (!getCurrentNetworkStatus()) {
      setSyncStatus("idle");
      await refreshSyncState();
      return;
    }

    setSyncStatus("syncing");
    setLastSyncError(null);
    const result = retry ? await retryFailedSyncItems() : await processSyncQueue();
    setSyncStatus(result.status);
    setPendingSyncCount(result.pendingCount);
    setLastSyncError(result.error ?? null);
  }, [refreshSyncState]);

  const retrySync = useCallback(async () => {
    await runSync(true);
  }, [runSync]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refreshSyncState(), 0);
    const unsubscribe = subscribeToSyncQueueChanges(() => void refreshSyncState());
    return () => {
      window.clearTimeout(timer);
      unsubscribe();
    };
  }, [refreshSyncState]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (isOnline) void runSync();
      else setSyncStatus("idle");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [isOnline, runSync]);

  useEffect(() => {
    if (!isOnline) return;
    const interval = window.setInterval(() => void runSync(), SYNC_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [isOnline, runSync]);

  return (
    <NetworkContext
      value={{
        isOnline,
        syncStatus,
        pendingSyncCount,
        lastSyncError,
        retrySync,
        refreshSyncState,
      }}
    >
      {children}
    </NetworkContext>
  );
}
