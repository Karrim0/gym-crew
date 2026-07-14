# Offline sync

The app must let a member record an entire workout with no connectivity
(a gym is often a dead zone) and sync it once they're back online. This
document describes the intended flow. Most of it is a documented
placeholder today — see "What's implemented vs. placeholder" below.

## Pieces

| Layer | File | Job |
| --- | --- | --- |
| Storage | `lib/offline/database.ts` | Dexie/IndexedDB database definition |
| Storage | `lib/offline/schema.ts` | Table names + row types |
| Write path | `lib/offline/sync-queue.ts` | Save locally, enqueue a mutation |
| Read path | `lib/offline/network-status.ts` | Detect online/offline |
| Drain | `lib/offline/sync-manager.ts` | Send queued mutations to Supabase |
| Conflicts | `lib/offline/conflict-resolution.ts` | Reconcile local vs. server state |
| Server | `app/api/sync/route.ts` | Placeholder batch-sync endpoint |

## Intended flow

1. **Start a workout.** `features/workouts/utils/build-session.ts` builds an
   in-memory `WorkoutSession` from the active split day, with client-generated record UUIDs and a
   separate session `clientId` (see `lib/utils/id.ts`).
2. **Record sets.** Every set/note change calls `saveWorkoutLocally` to
   persist to the `workoutSessions` / `workoutExercises` / `workoutSets`
   Dexie tables — this must succeed even with zero connectivity.
3. **Queue the change for sync.** Alongside the local save, call
   `enqueueOfflineMutation` to add an `OfflineMutation` (tagged with the
   same `clientId`) to the `syncQueue` table.
4. **Detect reconnection.** `NetworkProvider` (backed by
   `subscribeToNetworkStatus`) flips `isOnline` to `true`.
5. **Drain the queue.** `processSyncQueue` reads `syncQueue` in order and
   POSTs each mutation to `/api/sync` (or calls Supabase directly — TBD,
   see "Open questions"). Session, exercise, and set IDs are generated on the client, so replaying a mutation can upsert by primary key instead of creating duplicates. The session also carries `clientId` for batch idempotency and conflict matching.
6. **Handle conflicts.** If the server's copy of a session (matched by
   `clientId`) has been modified since the client last saw it,
   `resolveWorkoutSessionConflict` decides the outcome.
7. **Surface status.** `SyncStatusIndicator` reads `pendingSyncCount` /
   `syncStatus` from `NetworkContext` so the member always knows whether
   their workout is safely synced.

## What's implemented vs. placeholder

**Implemented:**
- Dexie database + normalized table schema (`lib/offline/database.ts`,
  `lib/offline/schema.ts`). Session rows do not duplicate nested exercises,
  and exercise rows do not duplicate nested sets.
- Online/offline detection (`lib/offline/network-status.ts`,
  wired into `NetworkProvider` via `useSyncExternalStore`).
- `OfflineMutation` / `SyncQueueItem` types (`src/types/domain.ts`).
- Client-id generation for idempotency (`lib/utils/id.ts`).

**Documented placeholders (throw `NotImplementedError` until built):**
- `saveWorkoutLocally`, `enqueueOfflineMutation`, `getPendingSyncCount`
  (`lib/offline/sync-queue.ts`).
- `processSyncQueue`, `retryFailedSyncItems`
  (`lib/offline/sync-manager.ts`).
- `resolveWorkoutSessionConflict`
  (`lib/offline/conflict-resolution.ts`).
- `POST /api/sync` returns `501 Not Implemented`
  (`app/api/sync/route.ts`).

None of these placeholders silently pretend to succeed — every one throws
(or, for the API route, returns a clear error status) so a caller can't
mistake "not built yet" for "succeeded with zero data."

## Open questions to resolve before implementing

- Does sync go through `/api/sync` (a batch endpoint, easier to make
  transactional) or do clients call Supabase directly per-mutation
  (simpler, leans on Supabase RLS instead of custom auth in the route
  handler)? The route handler exists as a placeholder for the former but
  isn't committed to yet.
- Conflict resolution default: `resolveWorkoutSessionConflict` currently
  accepts a `strategy` parameter defaulting to `"last-write-wins"` — decide
  if that's actually correct for a completed workout (probably not; losing
  a completed set to an older draft would be bad).
- Retry/backoff policy for `retryFailedSyncItems`.

## Service worker

`public/sw.js` is a minimal install/activate/fetch skeleton — no caching
strategy yet, and it must **never** cache authenticated API responses
(anything Supabase auth-related, or `/api/*`). Add a real strategy (e.g.
stale-while-revalidate for static assets only) as part of implementing the
above.
