import type { SplitExercise } from "@/types";

export interface SplitExerciseItemProps {
  splitExercise: SplitExercise;
}

/** Minimal placeholder row for a single exercise within a split day. */
export function SplitExerciseItem({ splitExercise }: SplitExerciseItemProps) {
  return (
    <li className="flex items-center justify-between text-sm">
      <span>Exercise {splitExercise.exerciseId.slice(0, 8)}</span>
      <span className="opacity-70">
        {splitExercise.targetSets} × {splitExercise.targetRepsMin}-{splitExercise.targetRepsMax}
      </span>
      {splitExercise.isPersonalAddition ? <span className="text-xs opacity-70">Personal</span> : null}
    </li>
  );
}
