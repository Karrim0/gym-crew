import { NotImplementedError } from "@/lib/utils/errors";
import type { ISODateString, Weekday } from "@/types";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Calculates a member's workout streak, counting only scheduled workout
 * days (i.e. rest days — Friday plus the member's chosen personal rest
 * days — do not break a streak).
 *
 * Left as a documented placeholder: the exact rule needs product input
 * before it can be implemented correctly, e.g.:
 * - Does completing a session a day late still count?
 * - What happens when a member changes their personal rest days
 *   mid-streak — is the streak recalculated retroactively?
 * - Does a fixed rest day (Friday) pause the streak or simply not count
 *   against it?
 */
export function calculateWorkoutStreak(
  completedWorkoutDates: ISODateString[],
  personalRestDays: Weekday[]
): StreakResult {
  void completedWorkoutDates;
  void personalRestDays;
  throw new NotImplementedError("calculateWorkoutStreak");
}
