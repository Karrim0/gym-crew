import {
  addDaysToDate,
  getScheduledDatesInRange,
  getTrainingWeekStart,
  getWeekdayFromDate,
  parseISODateOnly,
} from "@/lib/dates";
import type { ISODateOnlyString, Weekday } from "@/types";

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
}

/**
 * Weekly streaks are based on the athlete's own current schedule. A week is
 * complete only when every scheduled workout date has a completed session.
 * The still-open current week does not break an existing streak.
 */
export function calculateWorkoutStreak(
  completedWorkoutDates: ISODateOnlyString[],
  scheduledWeekdays: Weekday[],
  today = new Date(),
): StreakResult {
  if (scheduledWeekdays.length === 0 || completedWorkoutDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completed = new Set(completedWorkoutDates);
  const firstCompleted = completedWorkoutDates
    .map(parseISODateOnly)
    .sort((a, b) => a.getTime() - b.getTime())[0];
  const firstWeek = getTrainingWeekStart(firstCompleted);
  const currentWeek = getTrainingWeekStart(today);
  const weeks: Array<{ complete: boolean; isCurrent: boolean; closed: boolean }> = [];

  for (let weekStart = firstWeek; weekStart <= currentWeek; weekStart = addDaysToDate(weekStart, 7)) {
    const weekEnd = addDaysToDate(weekStart, 6);
    const requiredDates = getScheduledDatesInRange(weekStart, weekEnd, scheduledWeekdays);
    const complete = requiredDates.length > 0 && requiredDates.every((date) => completed.has(date));
    const isCurrent = weekStart.getTime() === currentWeek.getTime();
    const closed = !isCurrent || getWeekdayFromDate(today) === "friday";
    weeks.push({ complete, isCurrent, closed });
  }

  let longestStreak = 0;
  let running = 0;
  for (const week of weeks) {
    if (week.complete) {
      running += 1;
      longestStreak = Math.max(longestStreak, running);
    } else if (!week.isCurrent || week.closed) {
      running = 0;
    }
  }

  let currentStreak = 0;
  for (let index = weeks.length - 1; index >= 0; index -= 1) {
    const week = weeks[index];
    if (week.complete) {
      currentStreak += 1;
      continue;
    }
    if (week.isCurrent && !week.closed) continue;
    break;
  }

  return { currentStreak, longestStreak };
}
