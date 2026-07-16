"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useStopwatchContext } from "@/contexts/stopwatch-context";
import { formatDuration } from "@/lib/utils/format";

export function Stopwatch() {
  const { elapsedSeconds, isRunning, start, pause, reset } = useStopwatchContext();

  return (
    <div className="flex items-center justify-between rounded-2xl border bg-white p-4 shadow-sm dark:bg-neutral-950">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">وقت التمرين</p>
        <span className="font-mono text-3xl font-semibold tabular-nums">{formatDuration(elapsedSeconds)}</span>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={isRunning ? pause : start} className="rounded-full border p-3" aria-label={isRunning ? "وقّف الوقت" : "شغّل الوقت"}>
          {isRunning ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <button type="button" onClick={reset} className="rounded-full border p-3" aria-label="صفّر الوقت">
          <RotateCcw className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
