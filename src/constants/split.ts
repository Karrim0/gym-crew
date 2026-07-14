import type { Weekday, WorkoutType } from "@/types";

/**
 * The group's default weekly Push/Pull/Legs schedule. This is the
 * `workoutType` assigned to each weekday before any group- or user-level
 * customization is applied. Friday is fixed as a rest day (see
 * `FIXED_REST_DAY` in `./schedule`); the remaining days repeat P/P/L.
 *
 * This constant only maps weekday -> workout type. The actual exercises for
 * each day live in the database (`split_days` / `split_exercises`), seeded
 * separately — see docs/DATABASE_PLAN.md.
 */
export const DEFAULT_PPL_WEEKLY_SPLIT: Record<Weekday, WorkoutType> = {
  saturday: "push",
  sunday: "pull",
  monday: "legs",
  tuesday: "push",
  wednesday: "pull",
  thursday: "legs",
  friday: "rest",
};
