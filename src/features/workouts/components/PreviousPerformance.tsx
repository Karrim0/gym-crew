"use client";

import type { UUID } from "@/types";
import { formatDateArEg } from "@/lib/localization";
import { usePreviousPerformance } from "@/features/workouts/hooks/use-previous-performance";

export interface PreviousPerformanceProps {
  exerciseId: UUID;
}

export function PreviousPerformance({ exerciseId }: PreviousPerformanceProps) {
  const { performance, previousSets, isLoading } = usePreviousPerformance(exerciseId);

  if (isLoading) {
    return <p className="text-xs opacity-70">بنجيب أداء آخر مرة…</p>;
  }

  if (!performance || previousSets.length === 0) {
    return <p className="text-xs opacity-70">مفيش بيانات قديمة لسه.</p>;
  }

  return (
    <div className="space-y-1 text-xs opacity-70">
      <p>
        آخر مرة {formatDateArEg(performance.scheduledDate)}
      </p>
      <ul>
        {previousSets.map((set) => (
          <li key={set.id}>
            {set.weightKg ?? "—"} كجم × {set.reps ?? "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}
