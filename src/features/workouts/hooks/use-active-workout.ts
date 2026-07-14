"use client";

import { useState } from "react";
import type { WorkoutSession } from "@/types";

export interface UseActiveWorkoutResult {
  session: WorkoutSession | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Will load and hold the in-progress workout session for the active-workout
 * screen. Currently returns an empty, non-loading state — wire this up to
 * `features/workouts/services` and `lib/offline` once session recording is
 * implemented.
 */
export function useActiveWorkout(): UseActiveWorkoutResult {
  const [state] = useState<UseActiveWorkoutResult>({
    session: null,
    isLoading: false,
    error: null,
  });

  return state;
}
