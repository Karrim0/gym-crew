import type { PersonalRecord, PersonalRecordType, WorkoutSet } from "@/types";

export interface BrokenPersonalRecord {
  recordType: PersonalRecordType;
  previousValue: number | null;
  value: number;
}

export interface PersonalRecordComparison {
  isNewRecord: boolean;
  records: BrokenPersonalRecord[];
}

export function compareSetToPersonalRecord(
  set: WorkoutSet,
  existingRecords: PersonalRecord[],
): PersonalRecordComparison {
  if (!set.isCompleted || set.isWarmup) return { isNewRecord: false, records: [] };

  const values: Partial<Record<PersonalRecordType, number>> = {};
  if (set.weightKg !== null) values.max_weight = set.weightKg;
  if (set.reps !== null) values.max_reps = set.reps;
  if (set.weightKg !== null && set.reps !== null) values.max_volume = set.weightKg * set.reps;

  const existing = new Map(existingRecords.map((record) => [record.type, record.value]));
  const records = (Object.entries(values) as Array<[PersonalRecordType, number]>)
    .filter(([type, value]) => value > (existing.get(type) ?? -1))
    .map(([recordType, value]) => ({
      recordType,
      value,
      previousValue: existing.get(recordType) ?? null,
    }));

  return { isNewRecord: records.length > 0, records };
}
