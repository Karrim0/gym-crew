import type { Exercise, SplitDay, SplitExercise } from "@/types";

export interface SplitExerciseWithDetails extends SplitExercise {
  exercise: Exercise;
}

export interface SplitDayWithDetails extends Omit<SplitDay, "exercises"> {
  exercises: SplitExerciseWithDetails[];
}

export interface ReorderExercisesInput {
  splitDayId: SplitDay["id"];
  orderedExerciseIds: SplitExercise["id"][];
}

export interface EditSplitDayInput {
  splitDayId: SplitDay["id"];
  exercises: Pick<SplitExercise, "id" | "targetSets" | "targetRepsMin" | "targetRepsMax">[];
}
