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

export function StopwatchProvider({ children }: StopwatchProviderProps) {
  const [state, setState] = useState<StopwatchState>(INITIAL_STATE);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!state.isRunning) return;
    intervalRef.current = setInterval(() => {
      setState((current) => ({ ...current, elapsedSeconds: current.elapsedSeconds + 1 }));
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [state.isRunning]);

  const start = useCallback(() => {
    setState((current) => ({
      ...current,
      isRunning: true,
      startedAt: current.startedAt ?? new Date().toISOString(),
    }));
  }, []);

  const pause = useCallback(() => {
    setState((current) => ({ ...current, isRunning: false }));
  }, []);

  const reset = useCallback(() => setState(INITIAL_STATE), []);

  const hydrate = useCallback((startedAt: string, elapsedSeconds?: number) => {
    const elapsed = elapsedSeconds ?? Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000));
    setState({ isRunning: true, startedAt, elapsedSeconds: elapsed });
  }, []);

  const value: StopwatchContextValue = { ...state, start, pause, reset, hydrate };
  return <StopwatchContext value={value}>{children}</StopwatchContext>;
}
