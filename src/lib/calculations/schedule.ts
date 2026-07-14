import { FIXED_REST_DAY } from "@/constants/schedule";
import type { Weekday, WorkoutType } from "@/types";

/**
 * Determines what a member's schedule says about today: a workout type, or
 * rest. Pure function — pass in already-resolved data rather than fetching
 * it here, so it stays trivially testable.
 *
 * @param weekday - today's weekday.
 * @param personalRestDays - the member's up-to-two chosen additional rest days.
 * @param splitWorkoutTypeByWeekday - the member's effective split (group
 * default or personal override) mapping weekday -> workout type.
 */
export function determineTodaysScheduledWorkout(
  weekday: Weekday,
  personalRestDays: Weekday[],
  splitWorkoutTypeByWeekday: Record<Weekday, WorkoutType>
): WorkoutType | "rest" {
  if (weekday === FIXED_REST_DAY || personalRestDays.includes(weekday)) {
    return "rest";
  }
  return splitWorkoutTypeByWeekday[weekday];
}
