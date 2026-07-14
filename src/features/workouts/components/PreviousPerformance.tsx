"use client";

import type { UUID } from "@/types";
import { usePreviousPerformance } from "@/features/workouts/hooks/use-previous-performance";

export interface PreviousPerformanceProps {
  exerciseId: UUID;
}

/** Minimal placeholder showing the member's last completed sets for an exercise. */
export function PreviousPerformance({ exerciseId }: PreviousPerformanceProps) {
  const { previousSets, isLoading } = usePreviousPerformance(exerciseId);

  if (isLoading) {
    return <p className="text-xs opacity-70">Loading previous performance…</p>;
  }

  if (previousSets.length === 0) {
    return <p className="text-xs opacity-70">No previous data yet.</p>;
  }

  return (
    <ul className="text-xs opacity-70">
      {previousSets.map((set) => (
        <li key={set.id}>
          {set.weightKg ?? "—"} kg × {set.reps ?? "—"}
        </li>
      ))}
    </ul>
  );
}
