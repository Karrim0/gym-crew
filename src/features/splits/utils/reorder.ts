import type { SplitExercise } from "@/types";

/**
 * Returns a new array of split exercises with `order` reassigned to match
 * `orderedIds`. Pure and simple — the actual drag-and-drop interaction is
 * explicitly out of scope for this scaffold.
 */
export function reorderSplitExercises(
  exercises: SplitExercise[],
  orderedIds: SplitExercise["id"][]
): SplitExercise[] {
  const byId = new Map(exercises.map((exercise) => [exercise.id, exercise]));

  return orderedIds
    .map((id) => byId.get(id))
    .filter((exercise): exercise is SplitExercise => Boolean(exercise))
    .map((exercise, index) => ({ ...exercise, order: index }));
}
