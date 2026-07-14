/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState } from "react";
import type { UUID, WorkoutSet } from "@/types";
import { fetchPreviousPerformance } from "../services/workout-session.service";

export interface UsePreviousPerformanceResult {
  previousSets: WorkoutSet[];
  isLoading: boolean;
}

export function usePreviousPerformance(exerciseId: UUID): UsePreviousPerformanceResult {
  const [state, setState] = useState<UsePreviousPerformanceResult>({
    previousSets: [],
    isLoading: true,
  });

  useEffect(() => {
    let cancelled = false;
    setState((current) => ({ ...current, isLoading: true }));
    fetchPreviousPerformance(exerciseId)
      .then((previousSets) => {
        if (!cancelled) setState({ previousSets, isLoading: false });
      })
      .catch(() => {
        if (!cancelled) setState({ previousSets: [], isLoading: false });
      });
    return () => {
      cancelled = true;
    };
  }, [exerciseId]);

  return state;
}
