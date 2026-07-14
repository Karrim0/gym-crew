import { NotImplementedError } from "@/lib/utils/errors";
import type { SyncStatus } from "@/types";

export interface SyncResult {
  status: SyncStatus;
  syncedCount: number;
  failedCount: number;
}

/**
 * Drains the local sync queue, sending each pending mutation to Supabase in
 * order. Intended to run automatically when the app regains connectivity
 * (see `NetworkProvider`) and optionally on an interval while online.
 */
export async function processSyncQueue(): Promise<SyncResult> {
  throw new NotImplementedError("processSyncQueue");
}

/**
 * Re-attempts sync queue items that previously failed, typically triggered
 * from `SyncStatusIndicator` via a manual "retry" action.
 */
export async function retryFailedSyncItems(): Promise<SyncResult> {
  throw new NotImplementedError("retryFailedSyncItems");
}
