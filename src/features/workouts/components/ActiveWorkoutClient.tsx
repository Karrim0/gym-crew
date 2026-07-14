"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardCopy,
  Dumbbell,
  ListPlus,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Save,
  Trash2,
} from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useRestTimer } from "@/contexts/rest-timer-context";
import { SyncStatusIndicator } from "@/components/feedback/SyncStatusIndicator";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { CustomExerciseForm } from "@/features/exercises/components/CustomExerciseForm";
import { addSplitExercise } from "@/features/splits/services/split.service";
import type { Exercise, WorkoutSet } from "@/types";
import { useActiveWorkout } from "../hooks/use-active-workout";
import { usePreviousPerformance } from "../hooks/use-previous-performance";
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
import { SessionElapsedTime } from "./SessionElapsedTime";

interface SetEditorProps {
  set: WorkoutSet;
  previousSet?: WorkoutSet;
  onDelete: () => Promise<void>;
  onSaved: () => Promise<void>;
  onError: (message: string) => void;
}

function SetEditor({ set, previousSet, onDelete, onSaved, onError }: SetEditorProps) {
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
      await onSaved();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to save the set.");
    } finally {
      setSaving(false);
    }
  }

  async function toggle() {
    if (!completed && reps.trim() === "") {
      onError("Add your reps before completing the set.");
      return;
    }
    const next = !completed;
    setCompleted(next);
    await save(next);
  }

  function copyPrevious() {
    if (!previousSet) return;
    setWeight(previousSet.weightKg?.toString() ?? "");
    setReps(previousSet.reps?.toString() ?? "");
  }

  return (
    <div className={`rounded-2xl border p-3 transition ${completed ? "border-emerald-500/50 bg-emerald-500/[0.07]" : "bg-white dark:bg-neutral-950"}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`grid h-9 w-9 place-items-center rounded-xl text-sm font-black ${completed ? "bg-emerald-500 text-neutral-950" : "bg-neutral-100 dark:bg-neutral-800"}`}>{set.setNumber}</span>
          <div>
            <p className="text-sm font-black">Working set {set.setNumber}</p>
            <button type="button" disabled={!previousSet} onClick={copyPrevious} className="text-left text-xs text-neutral-500 disabled:opacity-50">
              {previousSet ? `Last: ${previousSet.weightKg ?? "—"} kg × ${previousSet.reps ?? "—"}` : "No previous set"}
            </button>
          </div>
        </div>
        <button type="button" onClick={() => void onDelete()} className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600" aria-label="Delete set"><Trash2 className="h-4 w-4" /></button>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-500">Weight
          <div className="mt-1 flex items-center rounded-xl border bg-neutral-50 px-3 dark:bg-neutral-900">
            <input inputMode="decimal" type="number" min={0} step="0.5" value={weight} onChange={(event) => setWeight(event.target.value)} onBlur={() => void save()} className="min-w-0 flex-1 bg-transparent py-3 text-center text-2xl font-black outline-none" />
            <span className="text-sm font-bold text-neutral-400">kg</span>
          </div>
        </label>
        <label className="text-xs font-bold uppercase tracking-wide text-neutral-500">Reps
          <input inputMode="numeric" type="number" min={0} value={reps} onChange={(event) => setReps(event.target.value)} onBlur={() => void save()} className="mt-1 w-full rounded-xl border bg-neutral-50 py-3 text-center text-2xl font-black outline-none focus:border-emerald-500 dark:bg-neutral-900" />
        </label>
      </div>

      <button type="button" disabled={saving} onClick={() => void toggle()} className={`mt-3 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-black transition ${completed ? "bg-emerald-500 text-neutral-950" : "bg-lime-300 text-neutral-950"}`}>
        <Check className="h-5 w-5" /> {saving ? "Saving…" : completed ? "Set completed" : "Complete set"}
      </button>
    </div>
  );
}

export function ActiveWorkoutClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");
  const { session, isLoading, error: loadError, reload } = useActiveWorkout(sessionId);
  const { isOnline } = useNetworkStatus();
  const restTimer = useRestTimer();
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [permanent, setPermanent] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExercisePicker, setShowExercisePicker] = useState(false);
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const initializedSession = useRef<string | null>(null);

  useEffect(() => {
    fetchExerciseLibrary().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    if (!session || initializedSession.current === session.id) return;
    initializedSession.current = session.id;
    setSessionNotes(session.notes);
    const firstIncomplete = session.exercises.findIndex((exercise) => exercise.sets.some((set) => !set.isCompleted));
    setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
  }, [session]);

  const currentExercise = session?.exercises[currentIndex] ?? null;
  const { previousSets } = usePreviousPerformance(currentExercise?.exerciseId ?? "");

  const totals = useMemo(() => {
    const exercises = session?.exercises ?? [];
    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.isCompleted).length, 0);
    const completedExercises = exercises.filter((exercise) => exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted)).length;
    return { totalSets, completedSets, completedExercises };
  }, [session]);

  async function addSet(exerciseId: string) {
    try {
      await addWorkoutSet(exerciseId);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add a set.");
    }
  }

  async function removeSet(setId: string) {
    try {
      await deleteWorkoutSet(setId);
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to delete the set.");
    }
  }

  async function addExercise(exercise = library.find((item) => item.id === selectedExercise)) {
    if (!session || !exercise) return;
    setBusy(true);
    setError(null);
    try {
      await addExerciseToWorkout(session.id, exercise.id, 2, !permanent || !isOnline);
      if (permanent && session.splitDayId) {
        if (!isOnline) {
          setError("Saved in this workout. Connect to add it permanently to your split.");
        } else {
          await addSplitExercise({ splitDayId: session.splitDayId, exercise, targetSets: 2, isPersonalAddition: true });
        }
      }
      setSelectedExercise("");
      setPermanent(false);
      setShowExercisePicker(false);
      setShowCustomExercise(false);
      await reload();
      setCurrentIndex(session.exercises.length);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add the exercise.");
    } finally {
      setBusy(false);
    }
  }

  async function copyPreviousPerformance() {
    if (!currentExercise || previousSets.length === 0) return;
    setBusy(true);
    try {
      await Promise.all(currentExercise.sets.map((set, index) => {
        const previous = previousSets[index];
        if (!previous) return Promise.resolve(set);
        return updateWorkoutSet(set.id, {
          weightKg: previous.weightKg,
          reps: previous.reps,
          isCompleted: false,
        });
      }));
      await reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to copy the previous performance.");
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
    if (!session) return;
    const incompleteSets = totals.totalSets - totals.completedSets;
    if (incompleteSets > 0 && !window.confirm(`${incompleteSets} sets are not completed. Finish the workout anyway?`)) return;
    setBusy(true);
    setError(null);
    try {
      await updateWorkoutSessionNotes(session.id, sessionNotes);
      const durationSeconds = Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
      await finishWorkoutSession(session.id, durationSeconds, sessionNotes);
      router.replace(`/workout/${session.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the workout.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">Loading active workout…</p>;
  if (loadError || !session || !currentExercise) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{loadError?.message ?? "No active workout found."}</p>;

  const currentComplete = currentExercise.sets.length > 0 && currentExercise.sets.every((set) => set.isCompleted);
  const progress = totals.totalSets > 0 ? (totals.completedSets / totals.totalSets) * 100 : 0;
  const exerciseCount = session.exercises.length;
  const availableExercises = library.filter((exercise) => !session.exercises.some((item) => item.exerciseId === exercise.id));

  function move(direction: -1 | 1) {
    setCurrentIndex((current) => Math.min(exerciseCount - 1, Math.max(0, current + direction)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto max-w-xl space-y-4 pb-36">
      <section className="sticky top-0 z-30 -mx-4 border-b bg-background/95 px-4 pb-3 pt-1 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">Gym mode</p>
            <SessionElapsedTime startedAt={session.startedAt} compact />
          </div>
          <SyncStatusIndicator />
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-800">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-neutral-500">
          <span>{totals.completedSets}/{totals.totalSets} sets</span>
          <span>{totals.completedExercises}/{session.exercises.length} exercises</span>
        </div>
      </section>

      {error ? <p className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
        {session.exercises.map((exercise, index) => {
          const done = exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted);
          return (
            <button key={exercise.id} type="button" onClick={() => setCurrentIndex(index)} className={`shrink-0 rounded-full border px-3 py-2 text-xs font-black transition ${index === currentIndex ? "border-neutral-950 bg-lime-300 text-neutral-950 dark:border-white" : done ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-white dark:bg-neutral-950"}`}>
              {done ? "✓ " : `${index + 1}. `}{exercise.exercise.name}
            </button>
          );
        })}
      </div>

      <section className="overflow-hidden rounded-[28px] border bg-white shadow-sm dark:bg-neutral-950">
        <div className="bg-[linear-gradient(135deg,rgba(183,255,60,.14),rgba(14,18,15,.98)_55%)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] opacity-55">Exercise {currentIndex + 1} of {session.exercises.length}</p>
              <h1 className="mt-1 truncate text-2xl font-black">{currentExercise.exercise.name}</h1>
              <p className="mt-1 text-sm capitalize opacity-60">{currentExercise.exercise.primaryMuscle}{currentExercise.isSessionOnlyAddition ? " · session only" : ""}</p>
            </div>
            <button type="button" onClick={async () => {
              if (!window.confirm("Remove this exercise from the active workout?")) return;
              await deleteWorkoutExercise(currentExercise.id);
              await reload();
              setCurrentIndex((index) => Math.max(0, Math.min(index, session.exercises.length - 2)));
            }} className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-red-300 dark:bg-black/10 dark:text-red-600" aria-label="Remove exercise"><Trash2 className="h-4 w-4" /></button>
          </div>

          <div className="mt-4 flex gap-2">
            <button type="button" disabled={previousSets.length === 0 || busy} onClick={() => void copyPreviousPerformance()} className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-black disabled:opacity-40 dark:bg-black/10"><ClipboardCopy className="h-4 w-4" /> Copy last session</button>
            <button type="button" onClick={() => setShowNotes((value) => !value)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-xs font-black dark:bg-black/10"><MessageSquareText className="h-4 w-4" /> Notes</button>
          </div>
        </div>

        <div className="space-y-3 p-4">
          {currentExercise.sets.map((set, index) => (
            <SetEditor key={`${set.id}:${set.updatedAt}`} set={set} previousSet={previousSets[index]} onDelete={() => removeSet(set.id)} onSaved={reload} onError={setError} />
          ))}

          <button type="button" onClick={() => void addSet(currentExercise.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed text-sm font-black"><Plus className="h-4 w-4" /> Add working set</button>

          {showNotes ? (
            <textarea defaultValue={currentExercise.notes} onBlur={(event) => void updateWorkoutExerciseNotes(currentExercise.id, event.target.value).catch((caught: Error) => setError(caught.message))} rows={3} placeholder="Setup, cues, machine position…" className="w-full rounded-xl border bg-neutral-50 p-3 text-sm outline-none focus:border-emerald-500 dark:bg-neutral-900" />
          ) : null}
        </div>
      </section>

      <section className="grid grid-cols-3 gap-2">
        {[180, 240, 300].map((seconds) => (
          <button key={seconds} type="button" onClick={() => { restTimer.setDuration(seconds); restTimer.open(); }} className="rounded-2xl border bg-white px-2 py-3 text-sm font-black shadow-sm dark:bg-neutral-950">
            Rest {seconds / 60}:00
          </button>
        ))}
      </section>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button type="button" disabled={currentIndex === 0} onClick={() => move(-1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border font-black disabled:opacity-30"><ChevronLeft className="h-5 w-5" /> Previous</button>
        <span className={`grid h-12 w-12 place-items-center rounded-full ${currentComplete ? "bg-emerald-500 text-neutral-950" : "bg-neutral-100 dark:bg-neutral-800"}`}>{currentComplete ? <Check className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}</span>
        <button type="button" disabled={currentIndex === session.exercises.length - 1} onClick={() => move(1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-lime-300 font-black text-neutral-950 disabled:opacity-30">Next <ChevronRight className="h-5 w-5" /></button>
      </div>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <button type="button" onClick={() => setShowExercisePicker((value) => !value)} className="flex w-full items-center gap-3 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><ListPlus className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-black">Add another exercise</span><span className="text-xs text-neutral-500">Session only or save it to your split</span></span>
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {showExercisePicker ? (
          <div className="mt-4 space-y-3">
            <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="w-full rounded-xl border bg-transparent px-3 py-3 text-sm">
              <option value="">Choose exercise…</option>
              {availableExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
            </select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={permanent} onChange={(event) => setPermanent(event.target.checked)} /> Also add it permanently to this split day</label>
            {!isOnline && permanent ? <p className="text-xs font-semibold text-amber-600">Permanent split changes need internet. It will still be saved in this session.</p> : null}
            <button type="button" disabled={!selectedExercise || busy} onClick={() => void addExercise()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-lime-300 px-4 py-3 font-black text-neutral-950 disabled:opacity-40"><Plus className="h-4 w-4" /> Add with 2 sets</button>
            <button type="button" onClick={() => setShowCustomExercise((value) => !value)} className="w-full rounded-xl border px-4 py-3 text-sm font-black">Create an exercise with my own name</button>
            {showCustomExercise ? <CustomExerciseForm compact defaultWorkoutType="custom" onCreated={addExercise} onCancel={() => setShowCustomExercise(false)} /> : null}
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <label className="text-sm font-black">Session notes
          <textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} onBlur={() => void updateWorkoutSessionNotes(session.id, sessionNotes)} rows={3} className="mt-2 w-full rounded-xl border bg-neutral-50 p-3 font-normal outline-none focus:border-emerald-500 dark:bg-neutral-900" placeholder="Energy, pain-free adjustments, anything worth remembering…" />
        </label>
      </section>

      <button type="button" disabled={busy} onClick={() => void finish()} className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 text-lg font-black text-neutral-950 shadow-lg shadow-emerald-500/20 disabled:opacity-50"><Save className="h-5 w-5" /> {busy ? "Finishing…" : "Finish workout"}</button>
    </div>
  );
}
