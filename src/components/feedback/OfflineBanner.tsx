"use client";

import { SyncStatusIndicator } from "./SyncStatusIndicator";
import { useNetworkStatus } from "@/hooks/use-network-status";

export function OfflineBanner() {
  const { isOnline, pendingSyncCount, syncStatus } = useNetworkStatus();

  if (isOnline && pendingSyncCount === 0 && syncStatus !== "syncing") return null;

  return (
    <div role="status" className="sticky top-0 z-50 flex w-full items-center justify-center border-b border-amber-300/15 bg-amber-300/10 px-3 py-2 backdrop-blur-xl">
      <SyncStatusIndicator />
    </div>
  );
}
