"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, Clock, Dumbbell } from "lucide-react";
import type { UUID } from "@/types";
import { formatDuration } from "@/lib/utils/format";
import type { WorkoutSessionWithDetails } from "../types";
import { fetchWorkoutHistory } from "../services/workout-session.service";

interface WorkoutHistoryClientProps { userId: UUID }

export function WorkoutHistoryClient({ userId }: WorkoutHistoryClientProps) {
  const [sessions, setSessions] = useState<WorkoutSessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutHistory(userId).then(setSessions).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load history.")).finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Loading workout history…</p>;
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (sessions.length === 0) return <div className="rounded-2xl border p-8 text-center"><Dumbbell className="mx-auto h-8 w-8 text-neutral-400" /><h2 className="mt-3 font-bold">No completed workouts yet</h2><Link href="/workout/today" className="mt-3 inline-block text-sm font-semibold underline">Start today’s workout</Link></div>;

  return (
    <div className="space-y-3">
      {sessions.map((session) => {
        const completedSets = session.exercises.flatMap((item) => item.sets).filter((set) => set.isCompleted).length;
        return (
          <Link key={session.id} href={`/workout/${session.id}`} className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Dumbbell className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">Workout · {session.exercises.length} exercises</p>
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(`${session.scheduledDate}T12:00:00`).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(session.durationSeconds)}</span>
                <span>{completedSets} sets</span>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-400" />
          </Link>
        );
      })}
    </div>
  );
}
