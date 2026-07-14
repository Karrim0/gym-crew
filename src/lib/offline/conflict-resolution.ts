import type { WorkoutSession } from "@/types";

export type ConflictResolutionStrategy = "last-write-wins" | "server-wins" | "manual";

/**
 * Workout drafts use a conservative last-write-wins rule. A completed set is
 * never replaced by an older incomplete copy, even when the parent session's
 * timestamp is newer. `manual` returns the local version so the UI can keep
 * the athlete's unsynced input visible instead of silently discarding it.
 */
export async function resolveWorkoutSessionConflict(
  local: WorkoutSession,
  remote: WorkoutSession,
  strategy: ConflictResolutionStrategy = "last-write-wins",
): Promise<WorkoutSession> {
  if (strategy === "server-wins") return remote;
  if (strategy === "manual") return local;

  const newer = local.updatedAt >= remote.updatedAt ? local : remote;
  const older = newer === local ? remote : local;
  const olderSets = new Map(
    older.exercises.flatMap((exercise) => exercise.sets.map((set) => [set.id, set] as const)),
  );

  return {
    ...newer,
    exercises: newer.exercises.map((exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => {
        const previous = olderSets.get(set.id);
        if (previous?.isCompleted && !set.isCompleted && previous.updatedAt > set.updatedAt) {
          return previous;
        }
        return set;
      }),
    })),
  };
}
