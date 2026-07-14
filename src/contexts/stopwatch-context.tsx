"use client";

import { createContext, useContext } from "react";
import type { StopwatchState, UUID } from "@/types";

export interface StopwatchContextValue extends StopwatchState {
  sessionId: UUID | null;
  start: () => void;
  pause: () => void;
  reset: () => void;
  hydrate: (sessionId: UUID, startedAt: string, elapsedSeconds?: number) => void;
}

export const StopwatchContext = createContext<StopwatchContextValue | undefined>(undefined);

export function useStopwatchContext(): StopwatchContextValue {
  const context = useContext(StopwatchContext);
  if (!context) throw new Error("useStopwatchContext must be used within StopwatchProvider.");
  return context;
}
