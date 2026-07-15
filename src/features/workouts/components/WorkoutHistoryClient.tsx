"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle2, ChevronRight, Clock, Dumbbell } from "lucide-react";
import type { UUID } from "@/types";
import { formatDuration } from "@/lib/utils/format";
import type { WorkoutSessionWithDetails } from "../types";
import { fetchWorkoutHistory } from "../services/workout-session.service";

interface WorkoutHistoryClientProps { userId: UUID }

export function WorkoutHistoryClient({ userId }: WorkoutHistoryClientProps) {
  const searchParams = useSearchParams();
  const [sessions, setSessions] = useState<WorkoutSessionWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutHistory(userId)
      .then(setSessions)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load history."))
      .finally(() => setIsLoading(false));
  }, [userId]);

  if (isLoading) return <div className="space-y-3 py-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-[18px] bg-white/[0.035]" />)}</div>;
  if (error) return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>;

  return (
    <div className="space-y-3">
      {searchParams.get("deleted") === "1" ? <p className="flex items-center gap-2 rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm text-emerald-200"><CheckCircle2 className="h-4 w-4" /> Workout deleted and analytics refreshed.</p> : null}

      {sessions.length === 0 ? (
        <div className="gc-card p-8 text-center"><Dumbbell className="mx-auto h-8 w-8 text-neutral-500" /><h2 className="mt-3 font-semibold">No completed workouts yet</h2><Link href="/workout/today" className="mt-4 inline-flex text-sm font-semibold text-indigo-200">Start today&apos;s workout</Link></div>
      ) : sessions.map((session) => {
        const completedSets = session.exercises.flatMap((item) => item.sets).filter((set) => set.isCompleted).length;
        return (
          <Link key={session.id} href={`/workout/${session.id}`} className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Dumbbell className="h-5 w-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{session.exercises.length} exercises · {completedSets} sets</p>
              <div className="mt-1.5 flex flex-wrap gap-3 text-xs text-neutral-500">
                <span className="inline-flex items-center gap-1"><CalendarDays className="h-3 w-3" /> {new Date(`${session.scheduledDate}T12:00:00`).toLocaleDateString()}</span>
                <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {formatDuration(session.durationSeconds)}</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-indigo-200/80">Open to review or delete</p>
            </div>
            <ChevronRight className="h-5 w-5 text-neutral-600" />
          </Link>
        );
      })}
    </div>
  );
}
