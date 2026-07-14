import type { WorkoutSet } from "@/types";
import { formatWeight } from "@/lib/utils/format";

export interface WorkoutSetRowProps {
  set: WorkoutSet;
  onChange?: (set: WorkoutSet) => void;
}

/** Minimal placeholder row for a single set's weight, reps, and completion state. */
export function WorkoutSetRow({ set }: WorkoutSetRowProps) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span>Set {set.setNumber}</span>
      <span>{set.weightKg !== null ? formatWeight(set.weightKg) : "—"}</span>
      <span>{set.reps ?? "—"} reps</span>
      <span>{set.isCompleted ? "✓" : ""}</span>
    </div>
  );
}
