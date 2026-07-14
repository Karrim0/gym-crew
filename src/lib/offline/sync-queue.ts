import { NotImplementedError } from "@/lib/utils/errors";
import type { OfflineMutation, WorkoutSession } from "@/types";

/**
 * Persists a workout session to the local Dexie database so it survives a
 * reload while offline. Does not attempt to contact Supabase.
 *
 * @returns the saved session, unchanged, once local persistence is wired up.
 */
export async function saveWorkoutLocally(session: WorkoutSession): Promise<WorkoutSession> {
  void session;
  throw new NotImplementedError("saveWorkoutLocally");
}

/**
 * Adds a mutation to the local sync queue for later delivery to Supabase.
 * Must be idempotent-safe: queued mutations carry a `clientId` so replaying
 * them after a retry does not create duplicate server-side records.
 */
export async function enqueueOfflineMutation(mutation: OfflineMutation): Promise<void> {
  void mutation;
  throw new NotImplementedError("enqueueOfflineMutation");
}

/**
 * Returns the number of mutations currently waiting to be synced. Used to
 * drive `SyncStatusIndicator`.
 */
export async function getPendingSyncCount(): Promise<number> {
  throw new NotImplementedError("getPendingSyncCount");
}
