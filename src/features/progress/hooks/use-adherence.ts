"use client";

import { useState } from "react";

export interface UseAdherenceResult {
  weekly: number | null;
  monthly: number | null;
  isLoading: boolean;
}

/**
 * Will load weekly/monthly adherence for the current user. Currently
 * returns an empty, non-loading state — wire this up to
 * `features/progress/services` once adherence tracking is implemented.
 */
export function useAdherence(): UseAdherenceResult {
  const [state] = useState<UseAdherenceResult>({ weekly: null, monthly: null, isLoading: false });
  return state;
}
