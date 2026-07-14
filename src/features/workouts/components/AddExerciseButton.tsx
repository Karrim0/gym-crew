"use client";

import { Plus } from "lucide-react";

export type AddExerciseScope = "session-only" | "permanent-split";

export interface AddExerciseButtonProps {
  /** Whether the added exercise applies to this session only, or the member's permanent split. */
  scope: AddExerciseScope;
  onAdd?: (scope: AddExerciseScope) => void;
}

/** Minimal placeholder button for adding an extra exercise, scoped to the session or the permanent split. */
export function AddExerciseButton({ scope, onAdd }: AddExerciseButtonProps) {
  const label = scope === "session-only" ? "Add exercise (this workout)" : "Add exercise (permanent)";

  return (
    <button type="button" onClick={() => onAdd?.(scope)} className="flex items-center gap-1 text-sm">
      <Plus className="h-4 w-4" aria-hidden />
      {label}
    </button>
  );
}
