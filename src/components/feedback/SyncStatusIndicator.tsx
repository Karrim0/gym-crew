"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { SYNC_STATE_LABELS } from "@/constants/sync";

/** Minimal placeholder indicator for the current sync state and queue depth. */
export function SyncStatusIndicator() {
  const { syncStatus, pendingSyncCount } = useNetworkStatus();

  return (
    <div className="flex items-center gap-1 text-xs opacity-70">
      <span>{SYNC_STATE_LABELS[syncStatus]}</span>
      {pendingSyncCount > 0 ? <span>({pendingSyncCount})</span> : null}
    </div>
  );
}
