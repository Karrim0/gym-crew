import { createClient } from "@/lib/supabase/client";
import type { StreakResult } from "@/lib/calculations/streaks";
import type { UUID } from "@/types";

/**
 * Daily consistency counts both completed planned workouts and planned rest
 * days. An unfinished workout for the current day does not break the streak
 * until the day closes.
 */
export async function fetchWorkoutStreak(_userId: UUID): Promise<StreakResult> {
  void _userId;
  const supabase = createClient();
  const { data, error } = await supabase.rpc("get_daily_consistency_streak");
  if (error) throw new Error(error.message);
  const row = data?.[0];
  return {
    currentStreak: row?.current_streak_days ?? 0,
    longestStreak: row?.longest_streak_days ?? 0,
  };
}
