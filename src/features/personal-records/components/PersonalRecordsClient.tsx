"use client";

import { useEffect, useMemo, useState } from "react";
import { Award } from "lucide-react";
import { formatWorkoutDate } from "@/lib/dates";
import { formatWeight } from "@/lib/utils/format";
import type { PersonalRecordType, UUID } from "@/types";
import { fetchPersonalRecords } from "../services/personal-record.service";
import type { PersonalRecordWithExerciseName } from "../types";

interface PersonalRecordsClientProps { userId: UUID }

const FILTERS: Array<{ value: "all" | PersonalRecordType; label: string }> = [
  { value: "all", label: "All" },
  { value: "max_weight", label: "Max weight" },
  { value: "max_reps", label: "Max reps" },
  { value: "max_volume", label: "Set volume" },
];

export function PersonalRecordsClient({ userId }: PersonalRecordsClientProps) {
  const [records, setRecords] = useState<PersonalRecordWithExerciseName[]>([]);
  const [filter, setFilter] = useState<"all" | PersonalRecordType>("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPersonalRecords(userId).then(setRecords).finally(() => setIsLoading(false));
  }, [userId]);

  const visible = useMemo(
    () => records.filter((record) => filter === "all" || record.type === filter),
    [filter, records],
  );

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Finding your records…</p>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((item) => (
          <button key={item.value} type="button" onClick={() => setFilter(item.value)} className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-sm ${filter === item.value ? "bg-lime-300 text-neutral-950" : ""}`}>{item.label}</button>
        ))}
      </div>
      {visible.length === 0 ? (
        <p className="rounded-2xl border bg-white p-6 text-center text-sm text-neutral-500 dark:bg-neutral-950">No records in this category yet.</p>
      ) : (
        <div className="space-y-3">
          {visible.map((record) => (
            <article key={`${record.exerciseId}-${record.type}`} className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40"><Award className="h-5 w-5" /></span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold">{record.exerciseName}</h2>
                  <p className="text-xs capitalize text-neutral-500">{record.primaryMuscle} · {record.type.replaceAll("_", " ")}</p>
                </div>
                <strong className="text-lg">{record.type === "max_reps" ? `${record.value} reps` : formatWeight(record.value)}</strong>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
                {record.weightKg !== null ? <span>Load: {formatWeight(record.weightKg)}</span> : null}
                {record.reps !== null ? <span>Reps: {record.reps}</span> : null}
                <span>{formatWorkoutDate(record.achievedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
