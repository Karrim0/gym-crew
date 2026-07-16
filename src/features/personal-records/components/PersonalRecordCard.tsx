import type { PersonalRecordWithExerciseName } from "../types";
import { formatWeight } from "@/lib/utils/format";

import { personalRecordTypeLabelAr, translateExerciseName } from "@/lib/localization";
export interface PersonalRecordCardProps {
  record: PersonalRecordWithExerciseName;
}

/** Minimal placeholder card for a single personal record. */
export function PersonalRecordCard({ record }: PersonalRecordCardProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="font-medium">{translateExerciseName(record.exerciseName)}</p>
      <p className="text-sm opacity-70">
        {personalRecordTypeLabelAr(record.type)}: {formatWeight(record.value)}
      </p>
    </div>
  );
}
