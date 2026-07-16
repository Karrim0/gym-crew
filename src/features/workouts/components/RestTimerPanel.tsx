"use client";

import { Bell, BellOff, Minus, Pause, Play, Plus, RotateCcw, TimerReset, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useRestTimer } from "@/contexts/rest-timer-context";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";
import { formatDuration } from "@/lib/utils/format";

const PRESETS = [60, 90, 120, 180] as const;

export function RestTimerPanel() {
  const timer = useRestTimer();
  if (!timer.isOpen) return null;

  const remainingRatio = timer.durationSeconds > 0 ? Math.max(0, Math.min(1, timer.remainingSeconds / timer.durationSeconds)) : 0;
  const radius = 82;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="fixed inset-0 z-[80] flex items-end overflow-y-auto bg-black/55 p-2 pb-[max(.5rem,env(safe-area-inset-bottom,0px))] backdrop-blur-md sm:items-center sm:justify-center sm:p-3" role="dialog" aria-modal="true" aria-label="Rest timer">
      <section className="max-h-[calc(100vh-1rem)] max-h-[calc(100svh-1rem)] w-full max-w-md overflow-y-auto rounded-[24px] border border-indigo-300/15 bg-[linear-gradient(155deg,#171b29,#0f121a_62%)] text-white shadow-[0_30px_100px_rgba(0,0,0,.65)] min-[380px]:rounded-[30px]">
        <div className="flex items-center justify-between px-5 pt-5">
          <div><p className="gc-eyebrow">Rest timer</p><h2 className="mt-1 text-xl font-bold">Recover. Then own the next set.</h2></div>
          <button type="button" onClick={timer.close} className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.04]" aria-label="Close rest timer"><X className="h-5 w-5" /></button>
        </div>

        <div className="px-3 py-4 text-center min-[380px]:px-5 min-[380px]:py-6">
          <div className="relative mx-auto grid h-44 w-44 place-items-center min-[380px]:h-52 min-[380px]:w-52">
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 200 200" aria-hidden>
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="12" />
              <circle cx="100" cy="100" r={radius} fill="none" stroke="rgb(165 180 252)" strokeWidth="12" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - remainingRatio)} className="transition-[stroke-dashoffset] duration-300" />
            </svg>
            <div><p className="font-mono text-4xl font-bold tabular-nums tracking-[-0.05em] min-[380px]:text-5xl">{formatDuration(timer.remainingSeconds)}</p><p className="mt-2 text-sm font-semibold text-white/55">{timer.completedAt && timer.remainingSeconds === 0 ? "Rest complete · next set is ready" : timer.isRunning ? "Breathe and reset" : "Start when the set ends"}</p></div>
          </div>

          <div className="mt-5 grid grid-cols-4 gap-2">
            {PRESETS.map((seconds) => <button key={seconds} type="button" onClick={() => timer.setDuration(seconds)} className={`rounded-xl border px-2 py-3 text-xs font-bold ${timer.durationSeconds === seconds ? "border-indigo-200 bg-indigo-300 text-[#11131a]" : "border-white/10 bg-white/[0.035] text-neutral-400"}`}>{seconds < 120 ? `${seconds}s` : `${seconds / 60}m`}</button>)}
          </div>

          <div className="mt-4 flex items-center justify-center gap-3">
            <button type="button" onClick={() => timer.addTime(-15)} className="inline-flex h-11 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold"><Minus className="h-4 w-4" /> 15s</button>
            <button type="button" onClick={timer.isRunning ? timer.pause : () => timer.start()} className="grid h-16 w-16 place-items-center rounded-full bg-indigo-300 text-[#11131a] shadow-lg shadow-indigo-500/20" aria-label={timer.isRunning ? "Pause rest timer" : "Start rest timer"}>{timer.isRunning ? <Pause className="h-7 w-7" /> : <Play className="ml-1 h-7 w-7" />}</button>
            <button type="button" onClick={() => timer.addTime(15)} className="inline-flex h-11 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-4 text-sm font-bold"><Plus className="h-4 w-4" /> 15s</button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-2">
            <button type="button" onClick={timer.reset} className="gc-secondary-button"><RotateCcw className="h-4 w-4" /> Reset</button>
            <button type="button" onClick={timer.skip} className="gc-secondary-button">Skip rest</button>
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3 text-left">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200">{timer.soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}</span><div><p className="text-sm font-bold">Finish sound</p><button type="button" onClick={timer.testSound} className="text-xs font-semibold text-indigo-200">Test sound</button></div></div>
            <button type="button" role="switch" aria-checked={timer.soundEnabled} onClick={() => timer.setSoundEnabled(!timer.soundEnabled)} className={`relative h-7 w-12 rounded-full transition ${timer.soundEnabled ? "bg-indigo-300" : "bg-white/10"}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-[#11131a] transition ${timer.soundEnabled ? "left-6" : "left-1"}`} /></button>
          </div>
        </div>
      </section>
    </div>
  );
}

export function RestTimerLauncher() {
  const timer = useRestTimer();
  const pathname = usePathname();
  const keyboardOpen = useVirtualKeyboard();
  if (!timer.scopeId || keyboardOpen) return null;
  const activeWorkout = pathname.startsWith("/workout/active");
  const active = timer.isRunning || timer.remainingSeconds !== timer.durationSeconds;

  return (
    <>
      <button type="button" onClick={timer.open} className={`fixed right-3 z-50 flex min-h-14 max-w-[calc(100vw-1.5rem)] items-center gap-3 rounded-2xl border px-4 shadow-2xl backdrop-blur-xl transition ${activeWorkout ? "bottom-3" : "bottom-[5.35rem] md:bottom-6"} ${timer.isRunning ? "border-indigo-200/30 bg-indigo-300 text-[#11131a] shadow-indigo-500/20" : "border-white/10 bg-[#151925]/95 text-white"}`} aria-label="Open rest timer">
        <span className={`grid h-9 w-9 place-items-center rounded-xl ${timer.isRunning ? "bg-black/10" : "bg-indigo-300/10 text-indigo-200"}`}><TimerReset className={`h-5 w-5 ${timer.isRunning ? "animate-pulse" : ""}`} /></span>
        <span className="text-left"><span className="block text-[9px] font-bold uppercase tracking-[0.14em] opacity-60">{timer.isRunning ? "Resting" : "Rest timer"}</span><span className="block font-mono text-base font-bold tabular-nums">{active ? formatDuration(timer.remainingSeconds) : "Ready"}</span></span>
      </button>
      <RestTimerPanel />
    </>
  );
}
