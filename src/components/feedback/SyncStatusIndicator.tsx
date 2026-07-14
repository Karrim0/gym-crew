"use client";

import { Cloud, CloudOff, RefreshCw } from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { SYNC_STATE_LABELS } from "@/constants/sync";

export function SyncStatusIndicator() {
  const {
    isOnline,
    syncStatus,
    pendingSyncCount,
    lastSyncError,
    retrySync,
  } = useNetworkStatus();

  const label = !isOnline
    ? pendingSyncCount > 0
      ? `Saved offline · ${pendingSyncCount} pending`
      : "Offline"
    : pendingSyncCount > 0 && syncStatus === "idle"
      ? `${pendingSyncCount} pending`
      : SYNC_STATE_LABELS[syncStatus];

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500" title={lastSyncError ?? undefined}>
      {isOnline ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
      <span>{label}</span>
      {syncStatus === "error" ? (
        <button
          type="button"
          onClick={() => void retrySync()}
          className="inline-flex items-center gap-1 font-semibold text-red-600"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Retry
        </button>
      ) : null}
    </div>
  );
}
