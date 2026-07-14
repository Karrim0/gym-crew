"use client";

import { useState } from "react";
import type { SplitDay } from "@/types";

export interface UseSplitResult {
  splitDays: SplitDay[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Will load either the group's or a member's personal split depending on
 * `scope`. Currently returns an empty, non-loading state — wire this up to
 * `features/splits/services` once split fetching is implemented.
 */
export function useSplit(scope: "group" | "personal"): UseSplitResult {
  void scope;
  const [state] = useState<UseSplitResult>({ splitDays: [], isLoading: false, error: null });
  return state;
}
