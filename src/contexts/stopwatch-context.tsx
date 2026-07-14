"use client";

import { createContext, useContext } from "react";
import type { StopwatchState } from "@/types";

export interface StopwatchContextValue extends StopwatchState {
  start: () => void;
  pause: () => void;
  reset: () => void;
  hydrate: (startedAt: string, elapsedSeconds?: number) => void;
}

export const StopwatchContext = createContext<StopwatchContextValue | undefined>(undefined);

export function useStopwatchContext(): StopwatchContextValue {
  const context = useContext(StopwatchContext);
  if (!context) throw new Error("useStopwatchContext must be used within StopwatchProvider.");
  return context;
}
