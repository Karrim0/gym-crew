"use client";

import { Minus, Pause, Play, Plus, RotateCcw, TimerReset, X } from "lucide-react";
import { useRestTimer } from "@/contexts/rest-timer-context";
import { formatDuration } from "@/lib/utils/format";

const PRESETS = [180, 240, 300] as const;

export function RestTimerPanel() {
  const timer = useRestTimer();
  if (!timer.isOpen) return null;

  const progress = timer.durationSeconds > 0
    ? Math.max(0, Math.min(100, ((timer.durationSeconds - timer.remainingSeconds) / timer.durationSeconds) * 100))
    : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-end bg-black/45 p-3 backdrop-blur-sm sm:items-center sm:justify-center" role="dialog" aria-modal="true" aria-label="Rest timer">
      <section className="w-full max-w-md overflow-hidden rounded-[28px] border border-white/10 bg-neutral-950 text-white shadow-2xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-400">Rest timer</p>
            <h2 className="mt-1 text-xl font-bold">Recover. Then go again.</h2>
          </div>
          <button type="button" onClick={timer.close} className="grid h-10 w-10 place-items-center rounded-full bg-white/10" aria-label="Close rest timer"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-5 py-6 text-center">
          <div className="relative mx-auto grid h-52 w-52 place-items-center rounded-full bg-white/[0.04]">
            <div className="absolute inset-2 rounded-full border-[10px] border-white/10" />
            <div className="absolute inset-2 rounded-full border-[10px] border-emerald-400 transition-all" style={{ clipPath: `inset(${100 - progress}% 0 0 0)` }} />
            <div>
              <p className="font-mono text-5xl font-bold tabular-nums">{formatDuration(timer.remainingSeconds)}</p>
              <p className="mt-2 text-sm font-semibold text-white/55">{timer.completedAt && timer.remainingSeconds === 0 ? "Rest complete" : timer.isRunning ? "Breathe and recover" : "Ready when you are"}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2">
            {PRESETS.map((seconds) => (
              <button key={seconds} type="button" onClick={() => timer.setDuration(seconds)} className={`rounded-2xl border px-3 py-3 text-sm font-bold ${timer.durationSeconds === seconds ? "border-emerald-400 bg-emerald-400 text-neutral-950" : "border-white/15 bg-white/[0.04]"}`}>
                {seconds / 60} min
              </button>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => timer.addTime(-30)} className="inline-flex h-11 items-center gap-1 rounded-full bg-white/10 px-4 text-sm font-bold"><Minus className="h-4 w-4" /> 30s</button>
            <button type="button" onClick={timer.isRunning ? timer.pause : () => timer.start()} className="grid h-16 w-16 place-items-center rounded-full bg-emerald-400 text-neutral-950 shadow-lg shadow-emerald-500/25" aria-label={timer.isRunning ? "Pause rest timer" : "Start rest timer"}>
              {timer.isRunning ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}
            </button>
            <button type="button" onClick={() => timer.addTime(30)} className="inline-flex h-11 items-center gap-1 rounded-full bg-white/10 px-4 text-sm font-bold"><Plus className="h-4 w-4" /> 30s</button>
          </div>

          <button type="button" onClick={timer.reset} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/55"><RotateCcw className="h-4 w-4" /> Reset to {Math.round(timer.durationSeconds / 60)} minutes</button>
        </div>
      </section>
    </div>
  );
}

export function RestTimerLauncher() {
  const timer = useRestTimer();
  if (!timer.scopeId) return null;
  return (
    <>
      <button type="button" onClick={timer.open} className={`fixed bottom-[5.35rem] right-4 z-50 flex min-h-14 items-center gap-2 rounded-full px-4 shadow-xl transition md:bottom-6 ${timer.isRunning ? "bg-emerald-400 text-neutral-950 shadow-emerald-500/25" : "bg-neutral-950 text-white"}`} aria-label="Open rest timer">
        {timer.isRunning ? <TimerReset className="h-5 w-5 animate-pulse" /> : <TimerReset className="h-5 w-5" />}
        <span className="font-mono text-sm font-bold tabular-nums">{timer.isRunning || timer.remainingSeconds !== timer.durationSeconds ? formatDuration(timer.remainingSeconds) : "REST"}</span>
      </button>
      <RestTimerPanel />
    </>
  );
}
