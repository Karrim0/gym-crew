import type { MuscleActivityLevel } from "../types";

export interface MuscleSummaryProps {
  muscleActivity: MuscleActivityLevel[];
}

/** Minimal placeholder table summarizing per-muscle training intensity. */
export function MuscleSummary({ muscleActivity }: MuscleSummaryProps) {
  return (
    <ul className="flex flex-col gap-1 text-sm">
      {muscleActivity.map((entry) => (
        <li key={entry.muscle} className="flex items-center justify-between">
          <span className="capitalize">{entry.muscle}</span>
          <span className="opacity-70">{Math.round(entry.intensity * 100)}%</span>
        </li>
      ))}
    </ul>
  );
}
