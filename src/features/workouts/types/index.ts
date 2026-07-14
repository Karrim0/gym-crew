import type { Exercise, WorkoutExercise, WorkoutSession, WorkoutSet } from "@/types";

export interface WorkoutExerciseWithDetails extends Omit<WorkoutExercise, "sets"> {
  exercise: Exercise;
  sets: WorkoutSet[];
}

export interface WorkoutSessionWithDetails extends Omit<WorkoutSession, "exercises"> {
  exercises: WorkoutExerciseWithDetails[];
}

export interface ActiveWorkoutViewModel {
  session: WorkoutSessionWithDetails;
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
