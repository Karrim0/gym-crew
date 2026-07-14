"use client";

import { Plus } from "lucide-react";
import type { UUID } from "@/types";

export interface AddSetButtonProps {
  workoutExerciseId: UUID;
  onAdd?: (workoutExerciseId: UUID) => void;
}

/** Minimal placeholder button for adding a new set to an exercise. */
export function AddSetButton({ workoutExerciseId, onAdd }: AddSetButtonProps) {
  return (
    <button
      type="button"
      onClick={() => onAdd?.(workoutExerciseId)}
      className="flex items-center gap-1 text-sm"
    >
      <Plus className="h-4 w-4" aria-hidden />
      Add set
    </button>
  );
}
