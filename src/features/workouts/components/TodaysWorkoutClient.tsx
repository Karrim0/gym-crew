/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Dumbbell, PencilLine, Play, RotateCcw } from "lucide-react";
import type { UUID, UserProfile, Weekday } from "@/types";
import type { SplitDayWithDetails } from "@/features/splits/types";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import { fetchProfile } from "@/features/profile/services/profile.service";
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

interface TodaysWorkoutClientProps {
  userId: UUID;
  compact?: boolean;
}

export function TodaysWorkoutClient({ userId, compact = false }: TodaysWorkoutClientProps) {
  const router = useRouter();
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [alternateDayId, setAlternateDayId] = useState("");
  const [browserToday, setBrowserToday] = useState<{ weekday: Weekday; date: string } | null>(null);
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [split, nextProfile, active] = await Promise.all([
        fetchPersonalSplit(userId),
        fetchProfile(userId),
        fetchActiveWorkoutSession(),
      ]);
      setDays(split);
      setProfile(nextProfile);
      setActiveSessionId(active?.id ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load today's workout.");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    const now = new Date();
    const nextToday = {
      weekday: DAY_BY_JS_INDEX[now.getDay()],
      date: getLocalDateValue(now),
    };
    setBrowserToday(nextToday);
    setScheduledDate(nextToday.date);
    void load();
  }, [load]);

  const weekday = browserToday?.weekday ?? null;
  const today = useMemo(
    () => (weekday ? days.find((day) => day.weekday === weekday) ?? null : null),
    [days, weekday],
  );
  const isPersonalRest = weekday
    ? profile?.additionalRestDays.includes(weekday) ?? false
    : false;
  const isRest = browserToday !== null && (!today || today.workoutType === "rest" || isPersonalRest);

  async function start(
    day: SplitDayWithDetails | null = today,
    targetDate = scheduledDate || getLocalDateValue(new Date()),
  ) {
    if (!day || day.workoutType === "rest") return;
    setIsStarting(true);
    setError(null);
    try {
      const session = await startWorkoutSession(userId, day, targetDate);
      router.push(`/workout/active?session=${session.id}`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start the workout.");
    } finally {
      setIsStarting(false);
    }
  }

  const trainableDays = days.filter((day) => day.workoutType !== "rest" && day.exercises.length > 0);
  const alternateDay = trainableDays.find((day) => day.id === alternateDayId) ?? null;

  if (isLoading || !browserToday || !weekday) return <div className="h-48 animate-pulse rounded-[20px] bg-white/[0.035]" />;

  const currentDate = browserToday.date;

  if (activeSessionId) {
    return (
      <section className="gc-card border-indigo-300/20 p-5 sm:p-6">
        <p className="gc-eyebrow">Workout in progress</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Continue where you stopped.</h2>
        <p className="mt-2 text-sm text-neutral-500">Your set data and timer are still available.</p>
        <Link href={`/workout/active?session=${activeSessionId}`} className="gc-primary-button mt-5 w-full sm:w-auto"><Play className="h-4 w-4" /> Continue workout</Link>
      </section>
    );
  }

  if (isRest) {
    return (
      <div className="space-y-4">
        <section className="gc-card p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-neutral-400"><RotateCcw className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="gc-eyebrow">Today</p>
              <h2 className="mt-1 text-xl font-bold capitalize">{weekday} is a rest day</h2>
              <p className="mt-1 text-sm text-neutral-500">Recovery is part of your plan and does not break adherence.</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Link href="/split/personal" className="gc-secondary-button"><PencilLine className="h-4 w-4" /> Edit plan</Link>
            <Link href="/workout/today" className="gc-secondary-button">Train anyway <ArrowRight className="h-4 w-4" /></Link>
          </div>
        </section>
        {!compact ? renderAlternateStarter() : null}
      </div>
    );
  }

  if (!today) {
    return (
      <section className="gc-card p-5 sm:p-6">
        <p className="gc-eyebrow">Plan needed</p>
        <h2 className="mt-2 text-xl font-bold">No workout is assigned to today.</h2>
        <p className="mt-2 text-sm text-neutral-500">Open your plan and choose a workout or keep today as recovery.</p>
        <Link href="/split/personal" className="gc-primary-button mt-5 w-full sm:w-auto">
          <PencilLine className="h-4 w-4" /> Open plan
        </Link>
      </section>
    );
  }

  const title = today.displayName ?? `${today.workoutType.charAt(0).toUpperCase()}${today.workoutType.slice(1)} day`;
  const displayedExercises = compact ? today.exercises.slice(0, 4) : today.exercises;

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p> : null}

      <section className="gc-card overflow-hidden p-0">
        <div className="border-b border-white/[0.06] p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-300 text-[#11131a]"><Dumbbell className="h-6 w-6" /></span>
            <div className="min-w-0 flex-1">
              <p className="gc-eyebrow capitalize">{weekday} · Today</p>
              <h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.03em]">{title}</h2>
              <p className="mt-1 text-sm text-neutral-500">{today.exercises.length} exercises in your personal plan</p>
            </div>
          </div>
          <button type="button" disabled={isStarting || today.exercises.length === 0} onClick={() => void start()} className="gc-primary-button mt-5 w-full disabled:opacity-50">
            <Play className="h-5 w-5" /> {isStarting ? "Starting…" : "Start today's workout"}
          </button>
        </div>

        <div className="p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold">Exercises</h3>{compact ? <Link href="/workout/today" className="text-xs font-semibold text-indigo-200">View full session</Link> : null}</div>
          <ol className="space-y-2">
            {displayedExercises.map((item, index) => (
              <li key={item.id} className="flex items-center gap-3 rounded-xl border border-white/[0.055] bg-white/[0.02] p-3">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white/[0.055] text-xs font-bold">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{item.exercise.name}</p><p className="mt-0.5 text-xs text-neutral-500">{item.targetSets} sets · {item.targetRepsMin}–{item.targetRepsMax} reps</p></div>
              </li>
            ))}
          </ol>
          {compact && today.exercises.length > displayedExercises.length ? <p className="mt-3 text-center text-xs text-neutral-500">+{today.exercises.length - displayedExercises.length} more exercises</p> : null}
        </div>
      </section>

      {!compact ? renderAlternateStarter() : null}
    </div>
  );

  function renderAlternateStarter() {
    return (
      <section className="gc-card p-4 sm:p-5">
        <h3 className="font-semibold">Train another split day</h3>
        <p className="mt-1 text-sm text-neutral-500">Useful for make-up sessions. Choose the planned date so adherence stays accurate.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <select value={alternateDayId} onChange={(event) => setAlternateDayId(event.target.value)} className="gc-input">
            <option value="">Choose split day…</option>
            {trainableDays.map((day) => <option key={day.id} value={day.id}>{day.weekday} · {day.displayName ?? day.workoutType}</option>)}
          </select>
          <input type="date" value={scheduledDate} max={currentDate} onChange={(event) => setScheduledDate(event.target.value)} className="gc-input" />
        </div>
        <button type="button" disabled={!alternateDay || isStarting} onClick={() => void start(alternateDay, scheduledDate)} className="gc-secondary-button mt-3 w-full disabled:opacity-40">Start selected workout</button>
      </section>
    );
  }
}
