import type { WorkoutSet } from "@/types";

/**
 * Total volume (weight × reps, summed across completed sets) for a single
 * exercise or an entire session — pass whichever slice of sets you have.
 * Sets without a recorded weight or rep count are skipped rather than
 * treated as zero, since "no data" and "zero volume" are different things.
 */
export function calculateWorkoutVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => {
    if (!set.isCompleted || set.weightKg === null || set.reps === null) {
      return total;
    }
    return total + set.weightKg * set.reps;
  }, 0);
}
