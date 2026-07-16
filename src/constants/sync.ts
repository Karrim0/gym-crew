import type { SyncStatus } from "@/types";

/** English internal identifiers for `SyncStatusIndicator` and sync logic. */
export const SYNC_STATES: readonly SyncStatus[] = ["idle", "syncing", "synced", "error"];

/** User-facing labels, keyed by sync state so localization stays centralized. */
export const SYNC_STATE_LABELS: Record<SyncStatus, string> = {
  idle: "كله محفوظ",
  syncing: "بنحفظ…",
  synced: "اتحفظ",
  error: "الحفظ وقف",
};
