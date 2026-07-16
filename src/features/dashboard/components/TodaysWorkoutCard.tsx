import type { WorkoutType } from "@/types";
import { WORKOUT_TYPE_LABELS_AR } from "@/lib/localization";

export interface TodaysWorkoutCardProps {
  scheduledWorkout: WorkoutType | "rest";
}

/** Minimal placeholder card summarizing today's scheduled workout or rest day. */
export function TodaysWorkoutCard({ scheduledWorkout }: TodaysWorkoutCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm opacity-70">النهارده</p>
      <p className="text-lg font-semibold capitalize">
        {scheduledWorkout === "rest" ? "يوم راحة" : WORKOUT_TYPE_LABELS_AR[scheduledWorkout]}
      </p>
    </div>
  );
}
