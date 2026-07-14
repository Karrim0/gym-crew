import { NotImplementedError } from "@/lib/utils/errors";
import type { PersonalRecord, WorkoutSet } from "@/types";

export interface PersonalRecordComparison {
  isNewRecord: boolean;
  recordType: PersonalRecord["type"] | null;
  previousValue: number | null;
}

/**
 * Compares a completed set against the user's existing personal records for
 * that exercise.
 *
 * Left as a documented placeholder because the real rule needs product
 * decisions before it can be implemented correctly, e.g.:
 * - Does a higher-weight set at fewer reps beat a max-volume record?
 * - Are records scoped per exercise variation (e.g. barbell vs dumbbell)?
 * - How are ties handled?
 */
export function compareSetToPersonalRecord(
  set: WorkoutSet,
  existingRecords: PersonalRecord[]
): PersonalRecordComparison {
  void set;
  void existingRecords;
  throw new NotImplementedError("compareSetToPersonalRecord");
}
