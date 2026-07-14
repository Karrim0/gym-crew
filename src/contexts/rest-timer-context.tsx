"use client";

import { createContext, useContext } from "react";

export interface RestTimerContextValue {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  isOpen: boolean;
  completedAt: string | null;
  open: () => void;
  close: () => void;
  setDuration: (seconds: number) => void;
  start: (seconds?: number) => void;
  pause: () => void;
  reset: () => void;
  addTime: (seconds: number) => void;
}

export const RestTimerContext = createContext<RestTimerContextValue | undefined>(undefined);

export function useRestTimer(): RestTimerContextValue {
  const context = useContext(RestTimerContext);
  if (!context) throw new Error("useRestTimer must be used within RestTimerProvider.");
  return context;
}
