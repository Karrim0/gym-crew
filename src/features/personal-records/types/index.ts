import type { PersonalRecord } from "@/types";

export interface PersonalRecordWithExerciseName extends PersonalRecord {
  exerciseName: string;
}
