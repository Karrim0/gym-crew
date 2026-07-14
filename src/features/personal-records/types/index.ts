import type { MuscleGroup, PersonalRecord } from "@/types";

export interface PersonalRecordWithExerciseName extends PersonalRecord {
  exerciseName: string;
  primaryMuscle: MuscleGroup;
}
