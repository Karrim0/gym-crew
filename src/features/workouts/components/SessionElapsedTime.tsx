"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";

interface SessionElapsedTimeProps {
  startedAt: string;
  completedAt?: string | null;
  compact?: boolean;
}

export function SessionElapsedTime({ startedAt, completedAt, compact = false }: SessionElapsedTimeProps) {
  const fixedEnd = useMemo(() => completedAt ? new Date(completedAt).getTime() : null, [completedAt]);
  const calculate = () => Math.max(0, Math.floor(((fixedEnd ?? Date.now()) - new Date(startedAt).getTime()) / 1000));
  const [seconds, setSeconds] = useState(calculate);

  useEffect(() => {
    if (fixedEnd) return;
    const interval = window.setInterval(() => {
      setSeconds(Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000)));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [fixedEnd, startedAt]);

  if (compact) {
    return <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold tabular-nums"><Clock3 className="h-4 w-4" /> {formatDuration(seconds)}</span>;
  }

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-neutral-500">Session time</p>
      <p className="mt-1 inline-flex items-center gap-2 font-mono text-xl font-black tabular-nums"><Clock3 className="h-5 w-5 text-emerald-500" /> {formatDuration(seconds)}</p>
    </div>
  );
}
