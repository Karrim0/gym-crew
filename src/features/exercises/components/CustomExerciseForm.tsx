"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { Exercise, MuscleGroup, WorkoutType } from "@/types";
import { createCustomExercise } from "../services/exercise.service";

const MUSCLES: readonly MuscleGroup[] = [
  "chest", "back", "shoulders", "biceps", "triceps",
  "quads", "hamstrings", "glutes", "calves", "core",
];

const WORKOUT_TYPES: readonly Exclude<WorkoutType, "rest">[] = ["push", "pull", "legs", "custom"];

interface CustomExerciseFormProps {
  defaultWorkoutType?: Exclude<WorkoutType, "rest">;
  compact?: boolean;
  onCreated: (exercise: Exercise) => void | Promise<void>;
  onCancel?: () => void;
}

export function CustomExerciseForm({ defaultWorkoutType = "custom", compact = false, onCreated, onCancel }: CustomExerciseFormProps) {
  const [name, setName] = useState("");
  const [primaryMuscle, setPrimaryMuscle] = useState<MuscleGroup>("chest");
  const [workoutType, setWorkoutType] = useState<Exclude<WorkoutType, "rest">>(defaultWorkoutType);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (name.trim().length < 2) {
      setError("Exercise name must be at least 2 characters.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const exercise = await createCustomExercise({
        name: name.trim(),
        primaryMuscle,
        secondaryMuscles: [],
        workoutType,
      });
      await onCreated(exercise);
      setName("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to create the exercise.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`rounded-2xl border border-dashed border-emerald-500/40 bg-emerald-500/[0.04] ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-black">Create your own exercise</p>
          <p className="text-xs text-neutral-500">Name it exactly the way you use it in the gym.</p>
        </div>
        {onCancel ? <button type="button" onClick={onCancel} className="grid h-9 w-9 place-items-center rounded-full border" aria-label="Close custom exercise form"><X className="h-4 w-4" /></button> : null}
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-3">
        <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Exercise name" className="rounded-xl border bg-white px-3 py-3 text-sm outline-none focus:border-emerald-500 dark:bg-neutral-950 sm:col-span-3" />
        <label className="text-xs font-semibold text-neutral-500">Primary muscle
          <select value={primaryMuscle} onChange={(event) => setPrimaryMuscle(event.target.value as MuscleGroup)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm capitalize text-neutral-950 dark:bg-neutral-950 dark:text-white">
            {MUSCLES.map((muscle) => <option key={muscle} value={muscle}>{muscle}</option>)}
          </select>
        </label>
        <label className="text-xs font-semibold text-neutral-500">Best fit
          <select value={workoutType} onChange={(event) => setWorkoutType(event.target.value as Exclude<WorkoutType, "rest">)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm capitalize text-neutral-950 dark:bg-neutral-950 dark:text-white">
            {WORKOUT_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </label>
        <button type="button" disabled={busy || name.trim().length < 2} onClick={() => void submit()} className="mt-auto inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-black text-neutral-950 disabled:opacity-40"><Plus className="h-4 w-4" /> {busy ? "Creating…" : "Create"}</button>
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
