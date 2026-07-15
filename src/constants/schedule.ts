import type { Weekday } from "@/types";

/** Canonical app-week order. The plan is flexible; no weekday is forced to rest. */
export const WEEKDAYS_STARTING_SATURDAY: readonly Weekday[] = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];
