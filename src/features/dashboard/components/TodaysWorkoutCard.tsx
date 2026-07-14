import type { WorkoutType } from "@/types";

export interface TodaysWorkoutCardProps {
  scheduledWorkout: WorkoutType | "rest";
}

/** Minimal placeholder card summarizing today's scheduled workout or rest day. */
export function TodaysWorkoutCard({ scheduledWorkout }: TodaysWorkoutCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm opacity-70">Today</p>
      <p className="text-lg font-semibold capitalize">
        {scheduledWorkout === "rest" ? "Rest day" : scheduledWorkout}
      </p>
    </div>
  );
}
