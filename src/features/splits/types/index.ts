import type { SplitDay, SplitExercise } from "@/types";

export interface ReorderExercisesInput {
  splitDayId: SplitDay["id"];
  orderedExerciseIds: SplitExercise["id"][];
}

export interface EditSplitDayInput {
  splitDayId: SplitDay["id"];
  exercises: Pick<SplitExercise, "id" | "targetSets" | "targetRepsMin" | "targetRepsMax">[];
}
