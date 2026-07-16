import type { WorkoutSession } from "@/types";
import { formatWorkoutDate } from "@/lib/dates";
import { workoutStatusLabelAr } from "@/lib/localization";

export interface WorkoutSessionHeaderProps {
  session: Pick<WorkoutSession, "scheduledDate" | "status">;
}

/** Minimal placeholder header for an active or historical workout session. */
export function WorkoutSessionHeader({ session }: WorkoutSessionHeaderProps) {
  return (
    <div className="flex items-center justify-between p-4">
      <span className="font-medium">{formatWorkoutDate(session.scheduledDate)}</span>
      <span className="text-sm opacity-70">{workoutStatusLabelAr(session.status)}</span>
    </div>
  );
}
