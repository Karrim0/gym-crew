"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils/format";

interface SetElapsedClockProps {
  startedAt: number | null;
}

export function SetElapsedClock({ startedAt }: SetElapsedClockProps) {
  const [elapsed, setElapsed] = useState(() =>
    startedAt ? Math.max(0, Math.floor((Date.now() - startedAt) / 1000)) : 0,
  );

  useEffect(() => {
    if (!startedAt) return;
    const interval = window.setInterval(() => {
      setElapsed(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [startedAt]);

  return <span className="font-mono tabular-nums">{formatDuration(startedAt ? elapsed : 0)}</span>;
}
