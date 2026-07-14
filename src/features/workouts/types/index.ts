import type { WorkoutExercise, WorkoutSession, WorkoutSet } from "@/types";

/** View-model shape used while a session is actively being recorded on screen. */
export interface ActiveWorkoutViewModel {
  session: WorkoutSession;
  isDirty: boolean;
}

export interface AddSetInput {
  workoutExerciseId: WorkoutExercise["id"];
}

export interface UpdateSetInput {
  setId: WorkoutSet["id"];
  weightKg: number | null;
  reps: number | null;
  isCompleted: boolean;
}
