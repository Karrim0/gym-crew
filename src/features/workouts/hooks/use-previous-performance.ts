"use client";

import { useState } from "react";
import type { UUID, WorkoutSet } from "@/types";

export interface UsePreviousPerformanceResult {
  previousSets: WorkoutSet[];
  isLoading: boolean;
}

/**
 * Will load the member's most recent completed sets for a given exercise,
 * to power `PreviousPerformance`. Currently returns an empty, non-loading
 * state.
 */
export function usePreviousPerformance(exerciseId: UUID): UsePreviousPerformanceResult {
  void exerciseId;
  const [state] = useState<UsePreviousPerformanceResult>({
    previousSets: [],
    isLoading: false,
  });

  return state;
}
