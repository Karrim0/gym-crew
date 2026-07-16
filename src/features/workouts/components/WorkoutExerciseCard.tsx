import type { ReactNode } from "react";
import type { WorkoutExercise } from "@/types";

import { translateExerciseName } from "@/lib/localization";
export interface WorkoutExerciseCardProps {
  workoutExercise: WorkoutExercise;
  exerciseName: string;
  children?: ReactNode;
}

/** Minimal placeholder card grouping one exercise's sets within a session. */
export function WorkoutExerciseCard({ exerciseName, children }: WorkoutExerciseCardProps) {
  return (
    <section className="rounded-lg border p-3">
      <h3 className="font-medium">{translateExerciseName(exerciseName)}</h3>
      <div className="mt-2 flex flex-col gap-1">{children}</div>
    </section>
  );
}
