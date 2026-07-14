import type { PersonalRecordWithExerciseName } from "../types";
import { PersonalRecordCard } from "./PersonalRecordCard";
import { EmptyState } from "@/components/feedback/EmptyState";

export interface PersonalRecordsListProps {
  records: PersonalRecordWithExerciseName[];
}

/** Minimal placeholder list of personal records. */
export function PersonalRecordsList({ records }: PersonalRecordsListProps) {
  if (records.length === 0) {
    return <EmptyState title="No personal records yet" description="Complete a workout to set your first one." />;
  }

  return (
    <div className="flex flex-col gap-2">
      {records.map((record) => (
        <PersonalRecordCard key={record.id} record={record} />
      ))}
    </div>
  );
}
