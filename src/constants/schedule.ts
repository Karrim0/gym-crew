import type { Weekday } from "@/types";

/**
 * Canonical weekday order for the app week, starting on Saturday. Use this
 * everywhere a week needs to be displayed or sorted so the order never
 * drifts between features.
 */
export const WEEKDAYS_STARTING_SATURDAY: readonly Weekday[] = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

/** Friday is always a rest day for every member — not user-configurable. */
export const FIXED_REST_DAY: Weekday = "friday";

/** Maximum number of additional personal rest days a member may choose. */
export const MAX_PERSONAL_REST_DAYS = 2;
