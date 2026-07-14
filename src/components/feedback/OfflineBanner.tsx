"use client";

import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function OfflineBanner() {
  const { isOnline, pendingSyncCount, syncStatus } = useNetworkStatus();

  if (isOnline && pendingSyncCount === 0 && syncStatus !== "syncing") return null;

  return (
    <div role="status" className="flex w-full items-center justify-center border-b bg-neutral-50 px-3 py-2 dark:bg-neutral-900">
      <SyncStatusIndicator />
    </div>
  );
}
