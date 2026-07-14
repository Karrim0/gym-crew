"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ExternalLink, Trophy } from "lucide-react";
import { formatWorkoutDate } from "@/lib/dates";
import { formatWeight } from "@/lib/utils/format";
import type { UUID } from "@/types";
import { fetchExerciseProgressDetails, type ExerciseProgressDetails } from "../services/progress.service";

export function ExerciseProgressDetailsClient({ userId, exerciseId }: { userId: UUID; exerciseId: UUID }) {
  const [details, setDetails] = useState<ExerciseProgressDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExerciseProgressDetails(userId, exerciseId).then(setDetails).finally(() => setIsLoading(false));
  }, [exerciseId, userId]);

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Loading exercise details…</p>;
  if (!details?.summary) return <p className="rounded-2xl border p-6 text-center text-sm text-neutral-500">No completed history for this exercise.</p>;

  const maxChartValue = Math.max(1, ...details.sessions.map((point) => point.estimatedOneRepMaxKg));
  const recentSessions = [...details.sessions].reverse().slice(0, 12);

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-sm capitalize opacity-70">{details.summary.primaryMuscle}</p>
        <h2 className="mt-1 text-2xl font-bold">{details.summary.exerciseName}</h2>
        <div className="mt-5 grid grid-cols-3 gap-3 text-center">
          <div><strong className="block text-lg">{formatWeight(details.summary.maxWeightKg)}</strong><span className="text-xs opacity-60">max load</span></div>
          <div><strong className="block text-lg">{formatWeight(details.summary.estimatedOneRepMaxKg)}</strong><span className="text-xs opacity-60">estimated 1RM</span></div>
          <div><strong className="block text-lg">{details.summary.sessionCount}</strong><span className="text-xs opacity-60">sessions</span></div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <h3 className="font-bold">Strength trend</h3>
        <p className="text-sm text-neutral-500">Estimated 1RM per session, useful for comparing sets with different reps.</p>
        <div className="mt-5 flex h-44 items-end gap-2 overflow-x-auto border-b pb-1">
          {details.sessions.map((point) => (
            <div key={point.sessionId} className="flex min-w-8 flex-1 flex-col items-center justify-end gap-1" title={`${formatWorkoutDate(point.date)} · ${formatWeight(point.estimatedOneRepMaxKg)}`}>
              <span className="text-[10px] text-neutral-500">{Math.round(point.estimatedOneRepMaxKg)}</span>
              <div className="w-full max-w-10 rounded-t bg-neutral-900 dark:bg-white" style={{ height: `${Math.max(4, (point.estimatedOneRepMaxKg / maxChartValue) * 120)}px` }} />
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <div className="flex items-center gap-2"><Trophy className="h-5 w-5 text-amber-500" /><h3 className="font-bold">Best reps at each weight</h3></div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {details.bestRepsByWeight.slice(0, 12).map((item) => (
            <div key={item.weightKg} className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"><strong className="block">{formatWeight(item.weightKg)}</strong><span className="text-sm text-neutral-500">{item.reps} reps</span></div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <h3 className="font-bold">Session-by-session log</h3>
        <div className="mt-3 space-y-3">
          {recentSessions.map((session) => (
            <article key={session.sessionId} className="rounded-xl border p-3">
              <div className="flex items-center justify-between gap-3"><div><p className="font-semibold">{formatWorkoutDate(session.date)}</p><p className="text-xs text-neutral-500">Volume {formatWeight(session.volume)} · e1RM {formatWeight(session.estimatedOneRepMaxKg)}</p></div><Link href={`/workout/${session.sessionId}`} className="rounded-lg p-2" aria-label="Open workout"><ExternalLink className="h-4 w-4" /></Link></div>
              <div className="mt-3 flex flex-wrap gap-2">{session.sets.map((set) => <span key={set.id} className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs dark:bg-neutral-800">{set.weightKg ?? "—"} kg × {set.reps ?? "—"}{set.isPersonalRecord ? " · PR" : ""}</span>)}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
