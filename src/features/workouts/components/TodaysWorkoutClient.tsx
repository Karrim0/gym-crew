"use client";

import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Dumbbell, PencilLine, Play, RotateCcw } from "lucide-react";
import type { UUID, Weekday } from "@/types";
import type { SplitDayWithDetails } from "@/features/splits/types";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import type { WorkoutSessionWithDetails } from "../types";
import { fetchActiveWorkoutSession, startWorkoutSession } from "../services/workout-session.service";

const DAY_BY_JS_INDEX: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function getLocalDateValue(date: Date): string {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 10);
}

function getDayTitle(day: SplitDayWithDetails) {
  return day.displayName ?? `${day.workoutType.charAt(0).toUpperCase()}${day.workoutType.slice(1)} day`;
}

function estimateMinutes(day: SplitDayWithDetails) {
  const workingSets = day.exercises.reduce((total, exercise) => total + exercise.targetSets, 0);
  return Math.max(20, Math.round((workingSets * 3.5) / 5) * 5);
}

interface TodaysWorkoutClientProps {
  userId: UUID;
  compact?: boolean;
}

export function TodaysWorkoutClient({ userId, compact = false }: TodaysWorkoutClientProps) {
  const router = useRouter();
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSessionWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [alternateDayId, setAlternateDayId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [split, active] = await Promise.all([
        fetchPersonalSplit(userId),
        fetchActiveWorkoutSession(),
      ]);
      setDays(split);
      setActiveSession(active);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load today's workout.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const currentDate = useSyncExternalStore(
    () => () => undefined,
    () => getLocalDateValue(new Date()),
    () => null,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const weekday = currentDate ? DAY_BY_JS_INDEX[new Date(`${currentDate}T12:00:00`).getDay()] : null;
  const today = useMemo(
    () => (weekday ? days.find((day) => day.weekday === weekday) ?? null : null),
    [days, weekday],
  );
  const trainableDays = days.filter((day) => day.workoutType !== "rest" && day.exercises.length > 0);
  const alternateDay = trainableDays.find((day) => day.id === alternateDayId) ?? null;

  async function start(day: SplitDayWithDetails | null = today) {
    if (!day || day.workoutType === "rest" || !currentDate) return;
    setIsStarting(true);
    setError(null);
    try {
      const session = await startWorkoutSession(userId, day, currentDate);
      router.push(`/workout/active?session=${session.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the workout.");
    } finally {
      setIsStarting(false);
    }
  }

  if (isLoading || !currentDate || !weekday) {
    return <div className="h-48 animate-pulse rounded-[20px] border border-white/[0.06] bg-white/[0.035]" />;
  }

  if (activeSession) {
    const totalSets = activeSession.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const completedSets = activeSession.exercises.reduce((total, exercise) => total + exercise.sets.filter((set) => set.isCompleted).length, 0);
    const title = activeSession.exercises[0]?.exercise.name ? "Workout in progress" : "Active workout";
    return (
      <section className="gc-card border-indigo-300/20 p-5 sm:p-6">
        <p className="gc-eyebrow">{title}</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Continue your workout</h2>
        <p className="mt-2 text-sm text-neutral-500">{completedSets} of {totalSets} sets completed. Your workout is saved on this device.</p>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-indigo-300" style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }} /></div>
        <Link href={`/workout/active?session=${activeSession.id}`} className="gc-primary-button mt-5 w-full sm:w-auto"><Play className="h-4 w-4" /> Continue workout</Link>
      </section>
    );
  }

  if (!today) {
    return (
      <section className="gc-card p-5 sm:p-6">
        <p className="gc-eyebrow">Plan needs attention</p>
        <h2 className="mt-2 text-xl font-bold">Today is missing from your split.</h2>
        <p className="mt-2 text-sm text-neutral-500">Open My split and assign this day as training or recovery.</p>
        <Link href={`/split/personal?day=${weekday}`} className="gc-primary-button mt-5 w-full sm:w-auto"><PencilLine className="h-4 w-4" /> Fix today&apos;s plan</Link>
      </section>
    );
  }

  if (today.workoutType === "rest") {
    return (
      <div className="space-y-4">
        <section className="gc-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-neutral-400"><RotateCcw className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="gc-eyebrow">Recovery day</p>
              <h2 className="mt-1 text-xl font-bold capitalize">Take today off</h2>
              <p className="mt-1 text-sm text-neutral-500">Recovery is part of the plan. Training another split day today will be treated as an extra workout.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href={`/split/personal?day=${weekday}`} className="gc-secondary-button"><PencilLine className="h-4 w-4" /> Edit day</Link>
            <Link href="/workout/today#alternate-workout" className="gc-secondary-button">Train anyway <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
        {!compact ? renderAlternateStarter() : null}
      </div>
    );
  }

  const title = getDayTitle(today);
  const displayedExercises = compact ? today.exercises.slice(0, 3) : today.exercises;
  const estimatedMinutes = estimateMinutes(today);

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p> : null}

      <section className="gc-card overflow-hidden p-0">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-300 text-[#11131a]"><Dumbbell className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="gc-eyebrow capitalize">{weekday} · Today</p>
              <h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.03em]">{title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{today.exercises.length} exercises · about {estimatedMinutes} min</p>
            </div>
          </div>
          <button type="button" disabled={isStarting || today.exercises.length === 0} onClick={() => void start()} className="gc-primary-button mt-5 w-full disabled:opacity-50">
            <Play className="h-5 w-5" /> {isStarting ? "Starting…" : "Start workout"}
          </button>
        </div>

        {!compact ? (
          <div className="border-t border-white/[0.06] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Today&apos;s exercises</h3><Link href={`/split/personal?day=${weekday}`} className="text-xs font-semibold text-indigo-200">Edit day</Link></div>
            <ol className="space-y-2">
              {displayedExercises.map((item, index) => (
                <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.02] p-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-xs font-bold">{index + 1}</span>
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.exercise.name}</p><p className="mt-0.5 text-xs text-neutral-500">{item.targetSets} sets · {item.targetRepsMin}–{item.targetRepsMax} reps</p></div>
                </li>
              ))}
            </ol>
          </div>
        ) : null}
      </section>

      {!compact ? renderAlternateStarter() : null}
    </div>
  );

  function renderAlternateStarter() {
    return (
      <section id="alternate-workout" className="gc-card scroll-mt-24 p-4 sm:p-5">
        <h3 className="font-semibold">Train another split day</h3>
        <p className="mt-1 text-sm text-neutral-500">This starts an extra workout for today. It will not replace a missed scheduled day.</p>
        <div className="mt-3 flex gap-2">
          <select value={alternateDayId} onChange={(event) => setAlternateDayId(event.target.value)} className="gc-input min-w-0 flex-1">
            <option value="">Choose split day…</option>
            {trainableDays.map((day) => <option key={day.id} value={day.id}>{day.weekday} · {getDayTitle(day)}</option>)}
          </select>
          <button type="button" disabled={!alternateDay || isStarting} onClick={() => void start(alternateDay)} className="gc-secondary-button shrink-0 disabled:opacity-40">Start</button>
        </div>
      </section>
    );
  }
}
