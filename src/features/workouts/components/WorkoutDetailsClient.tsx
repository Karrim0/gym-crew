"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/utils/format";
import type { UUID } from "@/types";
import type { WorkoutSessionWithDetails } from "../types";
import { fetchWorkoutSessionById } from "../services/workout-session.service";

export function WorkoutDetailsClient({ sessionId }: { sessionId: UUID }) {
  const [session, setSession] = useState<WorkoutSessionWithDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { fetchWorkoutSessionById(sessionId).then(setSession).catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load workout.")); }, [sessionId]);
  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!session) return <p className="py-8 text-center text-sm text-neutral-500">Loading workout…</p>;
  return (
    <div className="space-y-4">
      <section className="rounded-2xl bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-70">{new Date(`${session.scheduledDate}T12:00:00`).toLocaleDateString()}</p>
        <h2 className="text-2xl font-bold">Completed workout</h2>
        <p className="mt-2 text-sm opacity-70">{formatDuration(session.durationSeconds)} · {session.exercises.length} exercises</p>
      </section>
      {session.exercises.map((item) => (
        <section key={item.id} className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <h3 className="font-bold">{item.exercise.name}</h3>
          <div className="mt-3 space-y-2">
            {item.sets.map((set) => <div key={set.id} className="grid grid-cols-3 rounded-lg bg-neutral-50 px-3 py-2 text-sm dark:bg-neutral-900"><span>Set {set.setNumber}</span><span>{set.weightKg ?? "—"} kg</span><span>{set.reps ?? "—"} reps</span></div>)}
          </div>
          {item.notes ? <p className="mt-3 text-sm text-neutral-500">{item.notes}</p> : null}
        </section>
      ))}
      {session.notes ? <section className="rounded-2xl border p-4"><h3 className="font-semibold">Notes</h3><p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">{session.notes}</p></section> : null}
    </div>
  );
}
