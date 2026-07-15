"use client";

import type { UUID } from "@/types";
import { usePreviousPerformance } from "@/features/workouts/hooks/use-previous-performance";

export interface PreviousPerformanceProps {
  exerciseId: UUID;
}

export function PreviousPerformance({ exerciseId }: PreviousPerformanceProps) {
  const { performance, previousSets, isLoading } = usePreviousPerformance(exerciseId);

  if (isLoading) {
    return <p className="text-xs opacity-70">Loading previous performance…</p>;
  }

  if (!performance || previousSets.length === 0) {
    return <p className="text-xs opacity-70">No previous data yet.</p>;
  }

  return (
    <div className="space-y-1 text-xs opacity-70">
      <p>
        Last trained {new Date(`${performance.scheduledDate}T12:00:00`).toLocaleDateString()}
      </p>
      <ul>
        {previousSets.map((set) => (
          <li key={set.id}>
            {set.weightKg ?? "—"} kg × {set.reps ?? "—"}
          </li>
        ))}
      </ul>
    </div>
  );
}
