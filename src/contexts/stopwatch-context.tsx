"use client";

import { createContext, useContext } from "react";
import type { StopwatchState } from "@/types";

export interface StopwatchContextValue extends StopwatchState {
  start: () => void;
  pause: () => void;
  reset: () => void;
}

export const StopwatchContext = createContext<StopwatchContextValue | undefined>(undefined);

/**
 * Access the active workout's stopwatch. Must be used within
 * `StopwatchProvider` (see `components/providers/StopwatchProvider.tsx`),
 * which is only mounted for the active-workout route.
 */
export function useStopwatchContext(): StopwatchContextValue {
  const context = useContext(StopwatchContext);
  if (!context) {
    throw new Error("useStopwatchContext must be used within StopwatchProvider.");
  }
  return context;
}
