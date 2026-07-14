/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { fetchProfile } from "@/features/profile/services/profile.service";
import type { Exercise, GroupRole, UUID, Weekday } from "@/types";
import type { SplitDayWithDetails, SplitExerciseWithDetails } from "../types";
import {
  addSplitExercise,
  fetchGroupSplit,
  fetchPersonalSplit,
  moveSplitExercise,
  removeSplitExercise,
  resetPersonalSplitToGroup,
  updatePersonalRestDays,
  updateSplitExerciseTargets,
} from "../services/split.service";
import { RestDaySelector } from "./RestDaySelector";

interface SplitManagerProps {
  mode: "group" | "personal";
  groupId: UUID;
  userId: UUID;
  role: GroupRole;
}

interface ExerciseEditorProps {
  item: SplitExerciseWithDetails;
  index: number;
  count: number;
  canEdit: boolean;
  onReload: () => Promise<void>;
  onError: (message: string) => void;
}

function ExerciseEditor({ item, index, count, canEdit, onReload, onError }: ExerciseEditorProps) {
  const [sets, setSets] = useState(item.targetSets);
  const [min, setMin] = useState(item.targetRepsMin);
  const [max, setMax] = useState(item.targetRepsMax);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await onReload();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to update the split.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-xl border bg-neutral-50 p-3 dark:bg-neutral-900/60">
      <div className="flex items-start gap-3">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white text-sm font-bold shadow-sm dark:bg-neutral-800">{index + 1}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold">{item.exercise.name}</p>
              <p className="text-xs capitalize text-neutral-500">{item.exercise.primaryMuscle}{item.isPersonalAddition ? " · personal" : ""}</p>
            </div>
            {canEdit ? (
              <div className="flex gap-1">
                <button type="button" disabled={busy || index === 0} onClick={() => void run(() => moveSplitExercise(item.id, -1))} className="rounded-lg border p-1.5 disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
                <button type="button" disabled={busy || index === count - 1} onClick={() => void run(() => moveSplitExercise(item.id, 1))} className="rounded-lg border p-1.5 disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
                <button type="button" disabled={busy} onClick={() => void run(() => removeSplitExercise(item.id))} className="rounded-lg border p-1.5 text-red-600" aria-label="Remove exercise"><Trash2 className="h-4 w-4" /></button>
              </div>
            ) : null}
          </div>

          <div className="mt-3 grid grid-cols-4 gap-2">
            <label className="text-xs text-neutral-500">Sets<input type="number" min={1} max={20} disabled={!canEdit} value={sets} onChange={(event) => setSets(Number(event.target.value))} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5 text-neutral-950 dark:text-white" /></label>
            <label className="text-xs text-neutral-500">Min reps<input type="number" min={1} max={100} disabled={!canEdit} value={min} onChange={(event) => setMin(Number(event.target.value))} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5 text-neutral-950 dark:text-white" /></label>
            <label className="text-xs text-neutral-500">Max reps<input type="number" min={1} max={100} disabled={!canEdit} value={max} onChange={(event) => setMax(Number(event.target.value))} className="mt-1 w-full rounded-lg border bg-transparent px-2 py-1.5 text-neutral-950 dark:text-white" /></label>
            {canEdit ? <button type="button" disabled={busy} onClick={() => void run(() => updateSplitExerciseTargets(item.id, { targetSets: sets, targetRepsMin: min, targetRepsMax: max }))} className="mt-5 inline-flex items-center justify-center rounded-lg border p-2" aria-label="Save targets"><Save className="h-4 w-4" /></button> : null}
          </div>
        </div>
      </div>
    </li>
  );
}

export function SplitManager({ mode, groupId, userId, role }: SplitManagerProps) {
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [restDays, setRestDays] = useState<Weekday[]>([]);
  const [selectedExerciseByDay, setSelectedExerciseByDay] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [busyDay, setBusyDay] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = mode === "personal" || role === "owner" || role === "admin";

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextDays, nextLibrary, profile] = await Promise.all([
        mode === "group" ? fetchGroupSplit(groupId) : fetchPersonalSplit(userId),
        fetchExerciseLibrary(),
        mode === "personal" ? fetchProfile(userId) : Promise.resolve(null),
      ]);
      setDays(nextDays);
      setLibrary(nextLibrary);
      setRestDays(profile?.additionalRestDays ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the split.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, mode, userId]);

  useEffect(() => { void load(); }, [load]);

  const orderedDays = useMemo(() => [...days].sort((a, b) => WEEKDAYS_STARTING_SATURDAY.indexOf(a.weekday) - WEEKDAYS_STARTING_SATURDAY.indexOf(b.weekday)), [days]);

  async function add(day: SplitDayWithDetails) {
    const exerciseId = selectedExerciseByDay[day.id];
    const exercise = library.find((item) => item.id === exerciseId);
    if (!exercise) return;
    setBusyDay(day.id);
    setError(null);
    try {
      await addSplitExercise({ splitDayId: day.id, exercise, isPersonalAddition: mode === "personal" });
      setSelectedExerciseByDay((current) => ({ ...current, [day.id]: "" }));
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add the exercise.");
    } finally {
      setBusyDay(null);
    }
  }

  async function saveRestDays(next: Weekday[]) {
    setRestDays(next);
    setError(null);
    try {
      await updatePersonalRestDays(userId, next);
      setMessage("Rest days saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save rest days.");
      await load();
    }
  }

  async function reset() {
    if (!window.confirm("Reset your personal split to the current group split?")) return;
    setIsLoading(true);
    try {
      await resetPersonalSplitToGroup(userId);
      setMessage("Personal split reset.");
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset the split.");
      setIsLoading(false);
    }
  }

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-500">Loading split…</p>;

  return (
    <div className="space-y-5">
      {mode === "personal" ? (
        <section className="space-y-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <div>
            <h2 className="font-semibold">Additional rest days</h2>
            <p className="text-sm text-neutral-500">Friday stays fixed. Choose up to two more days.</p>
          </div>
          <RestDaySelector selectedDays={restDays} onChange={(next) => void saveRestDays(next)} />
          <button type="button" onClick={() => void reset()} className="inline-flex items-center gap-2 text-sm font-medium text-neutral-600 dark:text-neutral-300"><RotateCcw className="h-4 w-4" /> Reset to group split</button>
        </section>
      ) : (
        <p className="rounded-2xl border bg-white p-4 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
          {canEdit ? "Owners and admins can edit this shared plan. Changes do not overwrite members' existing personal copies until they reset." : "This is your group's shared plan. Only owners and admins can edit it."}
        </p>
      )}

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p> : null}

      {orderedDays.map((day) => {
        const personalRest = mode === "personal" && restDays.includes(day.weekday);
        const isRest = day.workoutType === "rest" || personalRest;
        const available = library.filter((exercise) => (exercise.workoutType === day.workoutType || exercise.workoutType === "custom") && !day.exercises.some((item) => item.exerciseId === exercise.id));
        return (
          <section key={day.id} className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
            <header className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold capitalize">{day.weekday}</h2>
                <p className="text-sm capitalize text-neutral-500">{personalRest ? "personal rest day" : day.workoutType}</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase dark:bg-neutral-800">{isRest ? "Rest" : `${day.exercises.length} exercises`}</span>
            </header>

            {!isRest ? (
              <>
                <ul className="space-y-2">
                  {day.exercises.map((item, index) => (
                    <ExerciseEditor key={item.id} item={item} index={index} count={day.exercises.length} canEdit={canEdit} onReload={load} onError={setError} />
                  ))}
                </ul>
                {canEdit ? (
                  <div className="mt-3 flex gap-2">
                    <select value={selectedExerciseByDay[day.id] ?? ""} onChange={(event) => setSelectedExerciseByDay((current) => ({ ...current, [day.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border bg-transparent px-3 py-2 text-sm">
                      <option value="">Choose an exercise…</option>
                      {available.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                    </select>
                    <button type="button" disabled={!selectedExerciseByDay[day.id] || busyDay === day.id} onClick={() => void add(day)} className="inline-flex items-center gap-1 rounded-xl bg-neutral-950 px-3 py-2 text-sm font-semibold text-white disabled:opacity-40 dark:bg-white dark:text-neutral-950"><Plus className="h-4 w-4" /> Add</button>
                  </div>
                ) : null}
              </>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
