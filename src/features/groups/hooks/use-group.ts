"use client";

import { useState } from "react";
import type { WorkoutGroup } from "@/types";

export interface UseGroupResult {
  group: WorkoutGroup | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Will load the current user's group. Currently returns an empty,
 * non-loading state — wire this up to `features/groups/services` once
 * group fetching is implemented.
 */
export function useGroup(): UseGroupResult {
  const [state] = useState<UseGroupResult>({ group: null, isLoading: false, error: null });
  return state;
}
