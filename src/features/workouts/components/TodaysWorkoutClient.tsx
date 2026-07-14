/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell, Play, RotateCcw } from "lucide-react";
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

interface TodaysWorkoutClientProps { userId: UUID }

export function TodaysWorkoutClient({ userId }: TodaysWorkoutClientProps) {
  const router = useRouter();
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [alternateDayId, setAlternateDayId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
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

  useEffect(() => { void load(); }, [load]);

  const weekday = DAY_BY_JS_INDEX[new Date().getDay()];
  const today = useMemo(() => days.find((day) => day.weekday === weekday) ?? null, [days, weekday]);
  const isPersonalRest = profile?.additionalRestDays.includes(weekday) ?? false;
  const isRest = !today || today.workoutType === "rest" || isPersonalRest;

  async function start(day: SplitDayWithDetails | null = today, targetDate = new Date().toISOString().slice(0, 10)) {
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
  const alternateStarter = (
    <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
      <h3 className="font-semibold">Train another day or log a make-up session</h3>
      <p className="mt-1 text-sm text-neutral-500">This uses your personal split. Choose the planned date so adherence stays accurate.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <select value={alternateDayId} onChange={(event) => setAlternateDayId(event.target.value)} className="rounded-xl border bg-transparent px-3 py-2.5">
          <option value="">Choose split day…</option>
          {trainableDays.map((day) => <option key={day.id} value={day.id}>{day.weekday} · {day.displayName ?? day.workoutType}</option>)}
        </select>
        <input type="date" value={scheduledDate} max={new Date().toISOString().slice(0, 10)} onChange={(event) => setScheduledDate(event.target.value)} className="rounded-xl border bg-transparent px-3 py-2.5" />
      </div>
      <button type="button" disabled={!alternateDay || isStarting} onClick={() => void start(alternateDay, scheduledDate)} className="mt-3 w-full rounded-xl border px-4 py-3 font-semibold disabled:opacity-40">Start selected workout</button>
    </section>
  );

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Preparing today’s workout…</p>;

  if (activeSessionId) {
    return (
      <section className="rounded-3xl bg-neutral-950 p-6 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-70">Workout in progress</p>
        <h2 className="mt-1 text-2xl font-bold">You already started a session.</h2>
        <Link href={`/workout/active?session=${activeSessionId}`} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-3 font-semibold text-neutral-950 dark:bg-neutral-950 dark:text-white"><Play className="h-4 w-4" /> Continue workout</Link>
      </section>
    );
  }

  if (isRest) {
    return (
      <div className="space-y-4">
      <section className="rounded-3xl border bg-white p-8 text-center dark:bg-neutral-950">
        <RotateCcw className="mx-auto h-10 w-10 text-neutral-400" />
        <h2 className="mt-3 text-2xl font-bold capitalize">{weekday} is a rest day</h2>
        <p className="mt-2 text-sm text-neutral-500">Rest days never break your planned streak.</p>
        <Link href="/split/personal" className="mt-5 inline-block text-sm font-semibold underline">Review personal split</Link>
      </section>
      {alternateStarter}
    </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      <section className="rounded-3xl bg-neutral-950 p-6 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-sm capitalize opacity-70">{weekday}</p>
        <h2 className="mt-1 text-3xl font-bold">{today.displayName ?? `${today.workoutType.charAt(0).toUpperCase()}${today.workoutType.slice(1)} day`}</h2>
        <p className="mt-2 text-sm opacity-70">{today.exercises.length} exercises ready</p>
        <button type="button" disabled={isStarting || today.exercises.length === 0} onClick={() => void start()} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 font-bold text-neutral-950 disabled:opacity-50 dark:bg-neutral-950 dark:text-white">
          <Play className="h-5 w-5" /> {isStarting ? "Starting…" : "Start workout"}
        </button>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <h3 className="mb-3 font-semibold">Today’s exercises</h3>
        <ol className="space-y-3">
          {today.exercises.map((item, index) => (
            <li key={item.id} className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-neutral-100 text-sm font-bold dark:bg-neutral-800">{index + 1}</span>
              <Dumbbell className="h-4 w-4 text-neutral-400" />
              <div className="flex-1">
                <p className="font-medium">{item.exercise.name}</p>
                <p className="text-xs text-neutral-500">{item.targetSets} sets · {item.targetRepsMin}–{item.targetRepsMax} reps</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
      {alternateStarter}
    </div>
  );
}
