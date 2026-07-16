import type { Exercise } from "@/types";
import { muscleLabelAr, translateExerciseName } from "@/lib/localization";

export interface ExerciseListItemProps {
  exercise: Exercise;
  onSelect?: (exercise: Exercise) => void;
}

/** Minimal placeholder row for a single exercise in a pickable list. */
export function ExerciseListItem({ exercise, onSelect }: ExerciseListItemProps) {
  return (
    <li>
      <button
        type="button"
        onClick={() => onSelect?.(exercise)}
        className="flex w-full items-center justify-between p-2 text-start"
      >
        <span>{translateExerciseName(exercise.name)}</span>
        <span className="text-xs capitalize opacity-70">{muscleLabelAr(exercise.primaryMuscle)}</span>
      </button>
    </li>
  );
}
