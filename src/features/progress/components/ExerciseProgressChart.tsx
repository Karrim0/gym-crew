import type { UUID } from "@/types";

export interface ExerciseProgressChartProps {
  exerciseId: UUID;
}

/**
 * Minimal placeholder for an exercise's progress-over-time chart.
 * No chart library is installed yet — this renders a text placeholder
 * until one is chosen and added.
 */
export function ExerciseProgressChart({ exerciseId }: ExerciseProgressChartProps) {
  return (
    <div className="flex h-40 items-center justify-center rounded-lg border text-sm opacity-70">
      Progress chart for exercise {exerciseId.slice(0, 8)}
    </div>
  );
}
