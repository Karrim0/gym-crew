import type { MuscleGroup, WorkoutType } from "@/types";

export interface ExerciseLibraryFilter {
  workoutType?: WorkoutType;
  muscle?: MuscleGroup;
  query?: string;
}
