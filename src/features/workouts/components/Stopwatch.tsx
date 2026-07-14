"use client";

import { useStopwatchContext } from "@/contexts/stopwatch-context";
import { formatDuration } from "@/lib/utils/format";

/** Minimal placeholder stopwatch display and controls, backed by `StopwatchProvider`. */
export function Stopwatch() {
  const { elapsedSeconds, isRunning, start, pause, reset } = useStopwatchContext();

  return (
    <div className="flex items-center gap-3">
      <span className="font-mono text-lg">{formatDuration(elapsedSeconds)}</span>
      <button type="button" onClick={isRunning ? pause : start} className="text-sm">
        {isRunning ? "Pause" : "Start"}
      </button>
      <button type="button" onClick={reset} className="text-sm">
        Reset
      </button>
    </div>
  );
}
