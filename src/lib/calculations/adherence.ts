/**
 * Calculates adherence as the fraction of scheduled workout days that were
 * actually completed.
 *
 * This is intentionally a plain ratio over pre-computed day lists (not a
 * function that fetches or joins session/split data itself) — reconciling
 * raw session history against a possibly-changed split and rest-day
 * selection over time is a modeling decision that belongs in
 * `features/progress/services`, not in this pure utility.
 *
 * @param scheduledWorkoutDayCount - number of non-rest days in the period.
 * @param completedWorkoutDayCount - number of those days with a completed session.
 * @returns a value between 0 and 1, or `null` if there were no scheduled days.
 */
export function calculateWeeklyAdherence(
  scheduledWorkoutDayCount: number,
  completedWorkoutDayCount: number
): number | null {
  if (scheduledWorkoutDayCount <= 0) {
    return null;
  }
  const ratio = completedWorkoutDayCount / scheduledWorkoutDayCount;
  return Math.min(1, Math.max(0, ratio));
}
