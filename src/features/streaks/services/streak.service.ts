import { calculateWorkoutStreak, type StreakResult } from "@/lib/calculations/streaks";
import { fetchProfile } from "@/features/profile/services/profile.service";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import { fetchWorkoutHistory } from "@/features/workouts/services/workout-session.service";
import type { UUID, Weekday } from "@/types";

export async function fetchWorkoutStreak(userId: UUID): Promise<StreakResult> {
  const [profile, split, history] = await Promise.all([
    fetchProfile(userId),
    fetchPersonalSplit(userId),
    fetchWorkoutHistory(userId),
  ]);

  const personalRestDays = new Set(profile?.additionalRestDays ?? []);
  const scheduledWeekdays = split
    .filter((day) => day.workoutType !== "rest" && !personalRestDays.has(day.weekday))
    .map((day) => day.weekday as Weekday);
  const completedDates = [...new Set(history.map((session) => session.scheduledDate))];

  return calculateWorkoutStreak(completedDates, scheduledWeekdays);
}
