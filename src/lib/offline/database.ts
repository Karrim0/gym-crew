import Dexie, { type EntityTable } from "dexie";
import { OFFLINE_DATABASE_NAME } from "@/lib/constants";
import { OFFLINE_TABLE_NAMES } from "./schema";
import type {
  CachedExerciseRow,
  CachedSplitRow,
  SyncQueueRow,
  WorkoutExerciseRow,
  WorkoutSessionRow,
  WorkoutSetRow,
} from "./schema";

/**
 * The app's IndexedDB database via Dexie.
 *
 * Versioning: whenever a table's shape changes, bump `.version(n)` and add a
 * new `.stores(...)` call rather than mutating the existing version, so
 * Dexie can run its built-in upgrade path for users with existing data.
 */
class GymCrewDatabase extends Dexie {
  workoutSessions!: EntityTable<WorkoutSessionRow, "id">;
  workoutExercises!: EntityTable<WorkoutExerciseRow, "id">;
  workoutSets!: EntityTable<WorkoutSetRow, "id">;
  syncQueue!: EntityTable<SyncQueueRow, "id">;
  cachedSplits!: EntityTable<CachedSplitRow, "id">;
  cachedExercises!: EntityTable<CachedExerciseRow, "id">;

  constructor() {
    super(OFFLINE_DATABASE_NAME);

    this.version(1).stores({
      [OFFLINE_TABLE_NAMES.workoutSessions]: "id, userId, groupId, scheduledDate, status, clientId, updatedAt",
      [OFFLINE_TABLE_NAMES.workoutExercises]: "id, workoutSessionId, exerciseId, order",
      [OFFLINE_TABLE_NAMES.workoutSets]: "id, workoutExerciseId, setNumber, updatedAt",
      [OFFLINE_TABLE_NAMES.syncQueue]: "id, idempotencyKey, status, createdAt, updatedAt",
      [OFFLINE_TABLE_NAMES.cachedSplits]: "id, groupId, ownerUserId, weekday",
      [OFFLINE_TABLE_NAMES.cachedExercises]: "id, workoutType",
    });
  }
}

/**
 * Lazily-created singleton. Dexie/IndexedDB only exists in the browser, so
 * this must never be instantiated during server rendering.
 */
let dbInstance: GymCrewDatabase | null = null;

export function getOfflineDatabase(): GymCrewDatabase {
  if (typeof window === "undefined") {
    throw new Error("getOfflineDatabase() can only be called in the browser.");
  }
  if (!dbInstance) {
    dbInstance = new GymCrewDatabase();
  }
  return dbInstance;
}
