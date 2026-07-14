import type {
  Exercise,
  SplitDay,
  SyncQueueItem,
  WorkoutExercise,
  WorkoutSession,
  WorkoutSet,
  UserProfile,
} from "@/types";

/**
 * Workout data is normalized so a set has one durable local source of truth.
 * Cached splits are intentionally denormalized because they are read as a
 * weekly document and refreshed as a unit.
 */
export type WorkoutSessionRow = Omit<WorkoutSession, "exercises">;
export type WorkoutExerciseRow = Omit<WorkoutExercise, "sets">;
export type WorkoutSetRow = WorkoutSet;
export type SyncQueueRow = SyncQueueItem;

export type CachedSplitRow = SplitDay & { cachedAt: string };
export type CachedExerciseRow = Exercise & { cachedAt: string };
export type CachedProfileRow = UserProfile & { cachedAt: string };

export const OFFLINE_TABLE_NAMES = {
  workoutSessions: "workoutSessions",
  workoutExercises: "workoutExercises",
  workoutSets: "workoutSets",
  syncQueue: "syncQueue",
  cachedSplits: "cachedSplits",
  cachedExercises: "cachedExercises",
  cachedProfiles: "cachedProfiles",
} as const;
