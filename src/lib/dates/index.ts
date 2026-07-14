import { format, parseISO } from "date-fns";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import type { ISODateString, Weekday } from "@/types";

const WEEKDAY_BY_JS_DAY_INDEX: Weekday[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/** Maps a JS `Date` to our `Weekday` union (`Date.getDay()` is 0 = Sunday). */
export function getWeekdayFromDate(date: Date): Weekday {
  return WEEKDAY_BY_JS_DAY_INDEX[date.getDay()];
}

/**
 * Sorts weekdays so the week reads Saturday -> Friday, matching how the
 * group's schedule is displayed throughout the app.
 */
export function sortWeekdaysStartingSaturday(weekdays: Weekday[]): Weekday[] {
  const order = WEEKDAYS_STARTING_SATURDAY;
  return [...weekdays].sort((a, b) => order.indexOf(a) - order.indexOf(b));
}

/** Formats an ISO date string for display, e.g. "Jul 13, 2026". */
export function formatWorkoutDate(isoDate: ISODateString): string {
  return format(parseISO(isoDate), "MMM d, yyyy");
}

/** Today's date as an ISO date string (`yyyy-MM-dd`), in the local timezone. */
export function getTodayISODate(): ISODateString {
  return format(new Date(), "yyyy-MM-dd");
}
