"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Dumbbell } from "lucide-react";
import { formatDuration } from "@/lib/utils/format";
import type { UUID } from "@/types";
import type { WorkoutSessionWithDetails } from "../types";
import { fetchWorkoutSessionById } from "../services/workout-session.service";
import { DeleteWorkoutSessionButton } from "./DeleteWorkoutSessionButton";

export function WorkoutDetailsClient({ sessionId }: { sessionId: UUID }) {
  const [session, setSession] = useState<WorkoutSessionWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkoutSessionById(sessionId)
      .then(setSession)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load workout."));
  }, [sessionId]);

  if (error) return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>;
  if (!session) return <p className="py-8 text-center text-sm text-neutral-500">Loading workout…</p>;

  const completedSets = session.exercises.flatMap((item) => item.sets).filter((set) => set.isCompleted).length;

  return (
    <div className="space-y-4 pb-8">
      <section className="gc-card p-5 sm:p-6">
        <p className="gc-eyebrow">Completed session</p>
        <h2 className="mt-2 text-2xl font-bold tracking-[-0.03em]">Workout summary</h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <div className="gc-stat"><CalendarDays className="h-4 w-4 text-indigo-200" /><strong className="mt-2 block text-sm">{new Date(`${session.scheduledDate}T12:00:00`).toLocaleDateString()}</strong><span className="text-[11px] text-neutral-500">date</span></div>
          <div className="gc-stat"><Clock3 className="h-4 w-4 text-indigo-200" /><strong className="mt-2 block text-sm">{formatDuration(session.durationSeconds)}</strong><span className="text-[11px] text-neutral-500">duration</span></div>
          <div className="gc-stat"><Dumbbell className="h-4 w-4 text-indigo-200" /><strong className="mt-2 block text-sm">{completedSets}</strong><span className="text-[11px] text-neutral-500">sets</span></div>
        </div>
      </section>

      {session.exercises.map((item) => (
        <section key={item.id} className="gc-card p-4 sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div><h3 className="font-bold">{item.exercise.name}</h3><p className="mt-0.5 text-xs capitalize text-neutral-500">{item.exercise.primaryMuscle}</p></div>
            <span className="gc-chip">{item.sets.filter((set) => set.isCompleted).length} sets</span>
          </div>
          <div className="mt-3 space-y-2">
            {item.sets.map((set) => (
              <div key={set.id} className="grid grid-cols-[auto_1fr_1fr] items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5 text-sm">
                <span className="grid h-7 w-7 place-items-center rounded-lg bg-white/[0.06] text-xs font-bold">{set.setNumber}</span>
                <span className="text-center"><strong>{set.weightKg ?? "—"}</strong> <span className="text-xs text-neutral-500">kg</span></span>
                <span className="text-center"><strong>{set.reps ?? "—"}</strong> <span className="text-xs text-neutral-500">reps</span></span>
              </div>
            ))}
          </div>
          {item.notes ? <p className="mt-3 rounded-xl bg-white/[0.025] p-3 text-sm leading-6 text-neutral-400">{item.notes}</p> : null}
        </section>
      ))}

      {session.notes ? <section className="gc-card p-4"><h3 className="font-semibold">Session notes</h3><p className="mt-2 text-sm leading-6 text-neutral-400">{session.notes}</p></section> : null}

      <section className="rounded-[18px] border border-red-400/15 bg-red-400/[0.035] p-4">
        <h3 className="font-semibold text-red-200">Session controls</h3>
        <p className="mb-3 mt-1 text-sm leading-6 text-neutral-500">Delete accidental test sessions so they do not affect your history or analytics.</p>
        <DeleteWorkoutSessionButton sessionId={session.id} />
      </section>
    </div>
  );
}
