/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { RestTimerContext, type RestTimerContextValue } from "@/contexts/rest-timer-context";

interface RestTimerProviderProps {
  children: ReactNode;
}

interface PersistedTimer {
  durationSeconds: number;
  remainingSeconds: number;
  isRunning: boolean;
  endsAt: number | null;
  completedAt: string | null;
}

const STORAGE_PREFIX = "gym-crew:rest-timer";
const DEFAULT_DURATION = 180;

function clampDuration(seconds: number) {
  return Math.min(15 * 60, Math.max(30, Math.floor(seconds)));
}

function storageKey(scopeId: string) {
  return `${STORAGE_PREFIX}:${scopeId}`;
}

export function RestTimerProvider({ children }: RestTimerProviderProps) {
  const [scopeId, setScopeId] = useState<string | null>(null);
  const [durationSeconds, setDurationSeconds] = useState(DEFAULT_DURATION);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_DURATION);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const resetState = useCallback(() => {
    setDurationSeconds(DEFAULT_DURATION);
    setRemainingSeconds(DEFAULT_DURATION);
    setEndsAt(null);
    setIsRunning(false);
    setCompletedAt(null);
    setIsOpen(false);
  }, []);

  useEffect(() => {
    setHydrated(false);
    if (!scopeId) {
      resetState();
      setHydrated(true);
      return;
    }

    const raw = window.localStorage.getItem(storageKey(scopeId));
    if (!raw) {
      resetState();
      setHydrated(true);
      return;
    }

    try {
      const stored = JSON.parse(raw) as PersistedTimer;
      const nextRemaining = stored.isRunning && stored.endsAt
        ? Math.max(0, Math.ceil((stored.endsAt - Date.now()) / 1000))
        : stored.remainingSeconds;
      setDurationSeconds(clampDuration(stored.durationSeconds));
      setRemainingSeconds(Math.max(0, nextRemaining));
      setEndsAt(stored.isRunning && nextRemaining > 0 ? stored.endsAt : null);
      setIsRunning(stored.isRunning && nextRemaining > 0);
      setCompletedAt(nextRemaining === 0 ? stored.completedAt ?? new Date().toISOString() : stored.completedAt);
    } catch {
      window.localStorage.removeItem(storageKey(scopeId));
      resetState();
    }
    setHydrated(true);
  }, [resetState, scopeId]);

  useEffect(() => {
    if (!hydrated || !scopeId) return;
    const payload: PersistedTimer = {
      durationSeconds,
      remainingSeconds,
      isRunning,
      endsAt,
      completedAt,
    };
    window.localStorage.setItem(storageKey(scopeId), JSON.stringify(payload));
  }, [completedAt, durationSeconds, endsAt, hydrated, isRunning, remainingSeconds, scopeId]);

  useEffect(() => {
    if (!isRunning || !endsAt) return;
    const tick = () => {
      const next = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setRemainingSeconds(next);
      if (next === 0) {
        setIsRunning(false);
        setEndsAt(null);
        setCompletedAt(new Date().toISOString());
        setIsOpen(true);
        if ("vibrate" in navigator) navigator.vibrate([250, 120, 250]);
      }
    };
    tick();
    const interval = window.setInterval(tick, 250);
    return () => window.clearInterval(interval);
  }, [endsAt, isRunning]);

  const setScope = useCallback((nextScopeId: string | null) => {
    setScopeId(nextScopeId);
  }, []);

  const setDuration = useCallback((seconds: number) => {
    const safe = clampDuration(seconds);
    setDurationSeconds(safe);
    setRemainingSeconds(safe);
    setEndsAt(null);
    setIsRunning(false);
    setCompletedAt(null);
  }, []);

  const start = useCallback((seconds?: number) => {
    const nextDuration = seconds ? clampDuration(seconds) : durationSeconds;
    const nextRemaining = seconds ? nextDuration : remainingSeconds > 0 ? remainingSeconds : nextDuration;
    setDurationSeconds(nextDuration);
    setRemainingSeconds(nextRemaining);
    setEndsAt(Date.now() + nextRemaining * 1000);
    setIsRunning(true);
    setCompletedAt(null);
  }, [durationSeconds, remainingSeconds]);

  const pause = useCallback(() => {
    if (endsAt) setRemainingSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
    setEndsAt(null);
    setIsRunning(false);
  }, [endsAt]);

  const reset = useCallback(() => {
    setRemainingSeconds(durationSeconds);
    setEndsAt(null);
    setIsRunning(false);
    setCompletedAt(null);
  }, [durationSeconds]);

  const clear = useCallback(() => {
    if (scopeId) window.localStorage.removeItem(storageKey(scopeId));
    resetState();
  }, [resetState, scopeId]);

  const addTime = useCallback((seconds: number) => {
    setCompletedAt(null);
    if (isRunning && endsAt) {
      const nextEnd = endsAt + seconds * 1000;
      setEndsAt(nextEnd);
      setRemainingSeconds(Math.max(0, Math.ceil((nextEnd - Date.now()) / 1000)));
      return;
    }
    setRemainingSeconds((current) => Math.max(0, Math.min(15 * 60, current + seconds)));
  }, [endsAt, isRunning]);

  const value = useMemo<RestTimerContextValue>(() => ({
    scopeId,
    durationSeconds,
    remainingSeconds,
    isRunning,
    isOpen,
    completedAt,
    setScope,
    open: () => setIsOpen(true),
    close: () => setIsOpen(false),
    setDuration,
    start,
    pause,
    reset,
    clear,
    addTime,
  }), [addTime, clear, completedAt, durationSeconds, isOpen, isRunning, pause, remainingSeconds, reset, scopeId, setDuration, setScope, start]);

  return <RestTimerContext value={value}>{children}</RestTimerContext>;
}
