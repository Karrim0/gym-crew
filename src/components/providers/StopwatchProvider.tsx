"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { StopwatchContext, type StopwatchContextValue } from "@/contexts/stopwatch-context";
import type { StopwatchState } from "@/types";

interface StopwatchProviderProps {
  children: ReactNode;
}

const INITIAL_STATE: StopwatchState = {
  isRunning: false,
  startedAt: null,
  elapsedSeconds: 0,
};

/**
 * Drives the active-workout stopwatch. Scoped to the active-workout route
 * (mount this in `app/(dashboard)/workout/active/layout.tsx` once that
 * layout exists) rather than globally, so the timer only runs during a
 * workout.
 */
export function StopwatchProvider({ children }: StopwatchProviderProps) {
  const [state, setState] = useState<StopwatchState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.isRunning) {
      return;
    }
    intervalRef.current = setInterval(() => {
      setState((current) => ({ ...current, elapsedSeconds: current.elapsedSeconds + 1 }));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const start = useCallback(() => {
    setState((current) => ({ ...current, isRunning: true, startedAt: new Date().toISOString() }));
  }, []);

  const pause = useCallback(() => {
    setState((current) => ({ ...current, isRunning: false }));
  }, []);

  const reset = useCallback(() => {
    setState(INITIAL_STATE);
  }, []);

  const value: StopwatchContextValue = { ...state, start, pause, reset };

  return <StopwatchContext value={value}>{children}</StopwatchContext>;
}
