import type {
  Exercise,
  SplitDay,
  SyncQueueItem,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
} from "@/types";

/**
 * IndexedDB is normalized even though the app-facing domain model is nested.
 * This prevents the same set from being stored both inside its session and in
 * the `workoutSets` table, which would otherwise create stale copies.
 */
export type WorkoutSessionRow = Omit<WorkoutSession, "exercises">;
export type WorkoutExerciseRow = Omit<WorkoutExercise, "sets">;
export type WorkoutSetRow = WorkoutSet;
export type SyncQueueRow = SyncQueueItem;

export type CachedSplitRow = Omit<SplitDay, "exercises"> & {
  cachedAt: string;
};

export type CachedExerciseRow = Exercise & { cachedAt: string };

export const OFFLINE_TABLE_NAMES = {
  workoutSessions: "workoutSessions",
  workoutExercises: "workoutExercises",
  workoutSets: "workoutSets",
  syncQueue: "syncQueue",
  cachedSplits: "cachedSplits",
  cachedExercises: "cachedExercises",
} as const;
