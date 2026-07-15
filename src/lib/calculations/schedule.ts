import type { Weekday, WorkoutType } from "@/types";

/**
 * Resolves a weekday directly from the effective split. Rest is represented by
 * split_days.workout_type = "rest"; no weekday has special hard-coded rules.
 */
export function determineTodaysScheduledWorkout(
  weekday: Weekday,
  _legacyPersonalRestDays: Weekday[],
  splitWorkoutTypeByWeekday: Record<Weekday, WorkoutType>,
): WorkoutType {
  return splitWorkoutTypeByWeekday[weekday];
}
