import { NotImplementedError } from "@/lib/utils/errors";
import type { Exercise, UUID, WorkoutType } from "@/types";

export async function fetchExerciseLibrary(workoutType?: WorkoutType): Promise<Exercise[]> {
  void workoutType;
  throw new NotImplementedError("fetchExerciseLibrary");
}

export async function fetchExerciseById(exerciseId: UUID): Promise<Exercise | null> {
  void exerciseId;
  throw new NotImplementedError("fetchExerciseById");
}

export async function createCustomExercise(
  exercise: Omit<Exercise, "id" | "isCustom">
): Promise<Exercise> {
  void exercise;
  throw new NotImplementedError("createCustomExercise");
}
