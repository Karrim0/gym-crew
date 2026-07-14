"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Plus, Save, Trash2 } from "lucide-react";
import { useStopwatchContext } from "@/contexts/stopwatch-context";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { SyncStatusIndicator } from "@/components/feedback/SyncStatusIndicator";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { addSplitExercise } from "@/features/splits/services/split.service";
import type { Exercise, WorkoutSet } from "@/types";
import { useActiveWorkout } from "../hooks/use-active-workout";
import {
  addExerciseToWorkout,
  addWorkoutSet,
  deleteWorkoutExercise,
  deleteWorkoutSet,
  finishWorkoutSession,
  updateWorkoutExerciseNotes,
  updateWorkoutSessionNotes,
  updateWorkoutSet,
} from "../services/workout-session.service";
import { PreviousPerformance } from "./PreviousPerformance";
import { Stopwatch } from "./Stopwatch";

interface SetEditorProps {
  set: WorkoutSet;
  onDelete: () => Promise<void>;
  onError: (message: string) => void;
}

function SetEditor({ set, onDelete, onError }: SetEditorProps) {
  const [weight, setWeight] = useState(set.weightKg?.toString() ?? "");
  const [reps, setReps] = useState(set.reps?.toString() ?? "");
  const [completed, setCompleted] = useState(set.isCompleted);
  const [saving, setSaving] = useState(false);

  async function save(nextCompleted = completed) {
    setSaving(true);
    try {
      await updateWorkoutSet(set.id, {
        weightKg: weight === "" ? null : Number(weight),
        reps: reps === "" ? null : Number(reps),
        isCompleted: nextCompleted,
      });
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to save the set.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle() {
    const next = !completed;
    setCompleted(next);
    await save(next);
  }

  return (
    <div className="grid grid-cols-[42px_1fr_1fr_42px_36px] items-end gap-2">
      <span className="pb-2 text-center text-sm font-semibold">{set.setNumber}</span>
      <label className="text-xs text-neutral-500">kg<input inputMode="decimal" type="number" min={0} step="0.5" value={weight} onChange={(event) => setWeight(event.target.value)} onBlur={() => void save()} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-center text-neutral-950 dark:text-white" /></label>
      <label className="text-xs text-neutral-500">reps<input inputMode="numeric" type="number" min={0} value={reps} onChange={(event) => setReps(event.target.value)} onBlur={() => void save()} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-2 text-center text-neutral-950 dark:text-white" /></label>
      <button type="button" disabled={saving} onClick={() => void toggle()} className={`mb-0.5 grid h-10 w-10 place-items-center rounded-lg border ${completed ? "bg-emerald-600 text-white" : ""}`} aria-label="Complete set"><Check className="h-4 w-4" /></button>
      <button type="button" onClick={() => void onDelete()} className="mb-0.5 grid h-10 w-9 place-items-center rounded-lg text-red-600" aria-label="Delete set"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}

export function ActiveWorkoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const { session, isLoading, error: loadError, reload } = useActiveWorkout(sessionId);
  const { hydrate, elapsedSeconds, reset } = useStopwatchContext();
  const { isOnline } = useNetworkStatus();
  const hydratedSession = useRef<string | null>(null);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [permanent, setPermanent] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchExerciseLibrary().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    if (session && hydratedSession.current !== session.id) {
      hydratedSession.current = session.id;
      setSessionNotes(session.notes);
      hydrate(session.id, session.startedAt, session.durationSeconds || undefined);
    }
  }, [hydrate, session]);

  async function addSet(exerciseId: string) {
    try {
      await addWorkoutSet(exerciseId);
      await reload();
    } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to add a set."); }
  }

  async function removeSet(setId: string) {
    try { await deleteWorkoutSet(setId); await reload(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to delete the set."); }
  }

  async function addExercise() {
    if (!session || !selectedExercise) return;
    const exercise = library.find((item) => item.id === selectedExercise);
    if (!exercise) return;
    setBusy(true);
    setError(null);
    try {
      await addExerciseToWorkout(session.id, exercise.id, 3, !permanent || !isOnline);
      if (permanent && session.splitDayId) {
        if (!isOnline) {
          setError("The exercise was added to this workout. Connect to the internet to add it permanently to your split.");
        } else {
          await addSplitExercise({ splitDayId: session.splitDayId, exercise, isPersonalAddition: true });
        }
      }
      setSelectedExercise("");
      setPermanent(false);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add the exercise.");
    } finally { setBusy(false); }
  }

  async function finish() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await updateWorkoutSessionNotes(session.id, sessionNotes);
      await finishWorkoutSession(session.id, elapsedSeconds, sessionNotes);
      reset();
      router.replace("/workout/history");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the workout.");
    } finally { setBusy(false); }
  }

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Loading active workout…</p>;
  if (loadError || !session) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError?.message ?? "No active workout found."}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 rounded-xl border bg-white px-3 py-2 dark:bg-neutral-950">
        <span className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Workout autosave</span>
        <SyncStatusIndicator />
      </div>
      <Stopwatch />
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}

      {session.exercises.map((workoutExercise) => (
        <section key={workoutExercise.id} className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-bold">{workoutExercise.exercise.name}</h2>
              <p className="text-xs capitalize text-neutral-500">{workoutExercise.exercise.primaryMuscle}{workoutExercise.isSessionOnlyAddition ? " · this session only" : ""}</p>
            </div>
            <button type="button" onClick={async () => { if (window.confirm("Remove this exercise from the active workout?")) { await deleteWorkoutExercise(workoutExercise.id); await reload(); } }} className="rounded-lg p-2 text-red-600" aria-label="Remove exercise"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="mt-3 rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">Last performance</p>
            <PreviousPerformance exerciseId={workoutExercise.exerciseId} />
          </div>
          <div className="mt-3 space-y-2">
            {workoutExercise.sets.map((set) => <SetEditor key={set.id} set={set} onDelete={() => removeSet(set.id)} onError={setError} />)}
          </div>
          <button type="button" onClick={() => void addSet(workoutExercise.id)} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold"><Plus className="h-4 w-4" /> Add set</button>
          <textarea defaultValue={workoutExercise.notes} onBlur={(event) => void updateWorkoutExerciseNotes(workoutExercise.id, event.target.value).catch((caught) => setError(caught.message))} rows={2} placeholder="Exercise notes…" className="mt-3 w-full rounded-xl border bg-transparent p-3 text-sm" />
        </section>
      ))}

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <h2 className="font-bold">Add another exercise</h2>
        <div className="mt-3 space-y-3">
          <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="w-full rounded-xl border bg-transparent px-3 py-2.5">
            <option value="">Choose exercise…</option>
            {library.filter((exercise) => !session.exercises.some((item) => item.exerciseId === exercise.id)).map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={permanent} onChange={(event) => setPermanent(event.target.checked)} /> Also add it permanently to this split day</label>
          {!isOnline && permanent ? <p className="text-xs text-amber-600">Permanent split changes need internet. The exercise will still be saved in this session.</p> : null}
          <button type="button" disabled={!selectedExercise || busy} onClick={() => void addExercise()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-semibold disabled:opacity-40"><Plus className="h-4 w-4" /> Add exercise</button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <label className="text-sm font-semibold">Workout notes<textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} onBlur={() => void updateWorkoutSessionNotes(session.id, sessionNotes)} rows={3} className="mt-2 w-full rounded-xl border bg-transparent p-3 font-normal" placeholder="How did the session feel?" /></label>
      </section>

      <button type="button" disabled={busy} onClick={() => void finish()} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-4 text-lg font-bold text-white disabled:opacity-50"><Save className="h-5 w-5" /> {busy ? "Finishing…" : "Finish workout"}</button>
    </div>
  );
}
