/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Pencil,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { CustomExerciseForm } from "@/features/exercises/components/CustomExerciseForm";
import { fetchProfile } from "@/features/profile/services/profile.service";
import type { Exercise, GroupRole, UUID, Weekday, WorkoutType } from "@/types";
import type { SplitDayWithDetails, SplitExerciseWithDetails } from "../types";
import {
  addSplitExercise,
  clearSplitDay,
  fetchGroupSplit,
  fetchPersonalSplit,
  moveSplitExercise,
  removeSplitExercise,
  resetPersonalSplitToGroup,
  updatePersonalRestDays,
  updateSplitDaySettings,
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
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setSets(item.targetSets);
    setMin(item.targetRepsMin);
    setMax(item.targetRepsMax);
  }, [item.targetRepsMax, item.targetRepsMin, item.targetSets]);

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
    <li className="rounded-2xl border bg-neutral-50 p-3 dark:bg-neutral-900/60">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white text-sm font-black shadow-sm dark:bg-neutral-800">{index + 1}</span>
        <button type="button" onClick={() => setExpanded((value) => !value)} className="min-w-0 flex-1 text-left">
          <p className="truncate font-black">{item.exercise.name}</p>
          <p className="text-xs capitalize text-neutral-500">{item.targetSets} sets · {item.targetRepsMin}–{item.targetRepsMax} reps · {item.exercise.primaryMuscle}{item.isPersonalAddition ? " · personal" : ""}</p>
        </button>
        {canEdit ? (
          <div className="flex gap-1">
            <button type="button" disabled={busy || index === 0} onClick={() => void run(() => moveSplitExercise(item.id, -1))} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30" aria-label="Move up"><ArrowUp className="h-4 w-4" /></button>
            <button type="button" disabled={busy || index === count - 1} onClick={() => void run(() => moveSplitExercise(item.id, 1))} className="grid h-9 w-9 place-items-center rounded-lg border disabled:opacity-30" aria-label="Move down"><ArrowDown className="h-4 w-4" /></button>
            <button type="button" disabled={busy} onClick={() => void run(() => removeSplitExercise(item.id))} className="grid h-9 w-9 place-items-center rounded-lg border text-red-600" aria-label="Remove exercise"><Trash2 className="h-4 w-4" /></button>
          </div>
        ) : null}
      </div>

      {expanded ? (
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2 border-t pt-3">
          <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Sets<input type="number" inputMode="numeric" min={1} max={20} disabled={!canEdit} value={sets} onChange={(event) => setSets(Number(event.target.value))} className="mt-1 w-full rounded-xl border bg-white px-2 py-2.5 text-center text-lg font-black text-neutral-950 dark:bg-neutral-950 dark:text-white" /></label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Min reps<input type="number" inputMode="numeric" min={1} max={100} disabled={!canEdit} value={min} onChange={(event) => setMin(Number(event.target.value))} className="mt-1 w-full rounded-xl border bg-white px-2 py-2.5 text-center text-lg font-black text-neutral-950 dark:bg-neutral-950 dark:text-white" /></label>
          <label className="text-[11px] font-bold uppercase tracking-wide text-neutral-500">Max reps<input type="number" inputMode="numeric" min={1} max={100} disabled={!canEdit} value={max} onChange={(event) => setMax(Number(event.target.value))} className="mt-1 w-full rounded-xl border bg-white px-2 py-2.5 text-center text-lg font-black text-neutral-950 dark:bg-neutral-950 dark:text-white" /></label>
          {canEdit ? <button type="button" disabled={busy} onClick={() => void run(() => updateSplitExerciseTargets(item.id, { targetSets: sets, targetRepsMin: min, targetRepsMax: max }))} className="mt-5 grid h-11 w-11 place-items-center rounded-xl bg-emerald-500 text-neutral-950" aria-label="Save targets"><Save className="h-4 w-4" /></button> : null}
        </div>
      ) : null}
    </li>
  );
}

interface DaySettingsProps {
  day: SplitDayWithDetails;
  canEdit: boolean;
  onSave: (workoutType: WorkoutType, displayName: string) => Promise<void>;
}

function DaySettings({ day, canEdit, onSave }: DaySettingsProps) {
  const [editing, setEditing] = useState(false);
  const [workoutType, setWorkoutType] = useState<WorkoutType>(day.workoutType);
  const [displayName, setDisplayName] = useState(day.displayName ?? "");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setWorkoutType(day.workoutType);
    setDisplayName(day.displayName ?? "");
  }, [day.displayName, day.workoutType]);

  if (!canEdit || day.weekday === "friday") return null;

  if (!editing) {
    return <button type="button" onClick={() => setEditing(true)} className="grid h-10 w-10 place-items-center rounded-full border" aria-label="Edit day settings"><Pencil className="h-4 w-4" /></button>;
  }

  return (
    <div className="mt-3 grid gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.04] p-3 sm:grid-cols-[1fr_140px_auto]">
      <label className="text-xs font-bold text-neutral-500">Day name
        <input value={displayName} maxLength={40} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Back & Biceps" className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm text-neutral-950 dark:bg-neutral-950 dark:text-white" />
      </label>
      <label className="text-xs font-bold text-neutral-500">Split type
        <select value={workoutType} onChange={(event) => setWorkoutType(event.target.value as WorkoutType)} className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 text-sm capitalize text-neutral-950 dark:bg-neutral-950 dark:text-white">
          <option value="push">Push</option>
          <option value="pull">Pull</option>
          <option value="legs">Legs</option>
          <option value="custom">Custom</option>
        </select>
      </label>
      <div className="flex items-end gap-2">
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); await onSave(workoutType, displayName); setBusy(false); setEditing(false); }} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 text-sm font-black text-neutral-950"><Save className="h-4 w-4" /> Save</button>
        <button type="button" onClick={() => setEditing(false)} className="h-11 rounded-xl border px-3 text-sm font-bold">Cancel</button>
      </div>
    </div>
  );
}

function defaultDayName(day: SplitDayWithDetails) {
  if (day.displayName) return day.displayName;
  if (day.workoutType === "rest") return "Rest day";
  return `${day.workoutType.charAt(0).toUpperCase()}${day.workoutType.slice(1)} day`;
}

export function SplitManager({ mode, groupId, userId, role }: SplitManagerProps) {
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [restDays, setRestDays] = useState<Weekday[]>([]);
  const [selectedExerciseByDay, setSelectedExerciseByDay] = useState<Record<string, string>>({});
  const [customDayId, setCustomDayId] = useState<string | null>(null);
  const [openDayIds, setOpenDayIds] = useState<Set<string>>(new Set());
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
      setOpenDayIds((current) => current.size > 0 ? current : new Set(nextDays.filter((day) => day.weekday !== "friday").slice(0, 1).map((day) => day.id)));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load the split.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, mode, userId]);

  useEffect(() => { void load(); }, [load]);

  const orderedDays = useMemo(() => [...days].sort((a, b) => WEEKDAYS_STARTING_SATURDAY.indexOf(a.weekday) - WEEKDAYS_STARTING_SATURDAY.indexOf(b.weekday)), [days]);

  async function add(day: SplitDayWithDetails, exerciseOverride?: Exercise) {
    const exerciseId = selectedExerciseByDay[day.id];
    const exercise = exerciseOverride ?? library.find((item) => item.id === exerciseId);
    if (!exercise) return;
    setBusyDay(day.id);
    setError(null);
    try {
      await addSplitExercise({ splitDayId: day.id, exercise, targetSets: 2, isPersonalAddition: mode === "personal" });
      setSelectedExerciseByDay((current) => ({ ...current, [day.id]: "" }));
      setCustomDayId(null);
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

  async function saveDay(day: SplitDayWithDetails, workoutType: WorkoutType, displayName: string) {
    try {
      await updateSplitDaySettings(day.id, workoutType, displayName);
      setMessage(`${day.weekday} updated.`);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the day.");
    }
  }

  async function clearDay(day: SplitDayWithDetails) {
    if (!window.confirm(`Remove all exercises from ${defaultDayName(day)}?`)) return;
    setBusyDay(day.id);
    try {
      await clearSplitDay(day.id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to clear the day.");
    } finally {
      setBusyDay(null);
    }
  }

  function toggleDay(dayId: string) {
    setOpenDayIds((current) => {
      const next = new Set(current);
      if (next.has(dayId)) next.delete(dayId); else next.add(dayId);
      return next;
    });
  }

  if (isLoading) return <p className="py-10 text-center text-sm text-neutral-500">Loading split…</p>;

  return (
    <div className="space-y-5 pb-20">
      {mode === "personal" ? (
        <section className="space-y-3 rounded-[26px] border bg-white p-4 shadow-sm dark:bg-neutral-950">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-emerald-600">Your schedule</p>
            <h2 className="mt-1 text-xl font-black">Build the week around you</h2>
            <p className="mt-1 text-sm text-neutral-500">Friday stays fixed. Choose up to two extra rest days; your exercise plan stays saved underneath.</p>
          </div>
          <RestDaySelector selectedDays={restDays} onChange={(next) => void saveRestDays(next)} />
          <button type="button" onClick={() => void reset()} className="inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-bold"><RotateCcw className="h-4 w-4" /> Reset to group split</button>
        </section>
      ) : (
        <p className="rounded-2xl border bg-white p-4 text-sm text-neutral-600 dark:bg-neutral-950 dark:text-neutral-300">
          {canEdit ? "Owners and admins can edit the shared starting plan. Members keep their personal version until they choose to reset." : "This is the shared group plan. Your personal split can still be changed however you want."}
        </p>
      )}

      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {message ? <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">{message}</p> : null}

      {orderedDays.map((day) => {
        const personalRest = mode === "personal" && restDays.includes(day.weekday);
        const fixedRest = day.workoutType === "rest";
        const open = openDayIds.has(day.id);
        const available = library.filter((exercise) => {
          const typeMatches = day.workoutType === "custom" || exercise.workoutType === day.workoutType || exercise.workoutType === "custom";
          return typeMatches && !day.exercises.some((item) => item.exerciseId === exercise.id);
        });
        const customDefaultType = day.workoutType === "rest" ? "custom" : day.workoutType;

        return (
          <section key={day.id} className={`overflow-hidden rounded-[26px] border bg-white shadow-sm dark:bg-neutral-950 ${personalRest ? "border-amber-400/50" : ""}`}>
            <header className="p-4">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => toggleDay(day.id)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-neutral-100 dark:bg-neutral-800" aria-label={open ? "Collapse day" : "Expand day"}>{open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</button>
                <button type="button" onClick={() => toggleDay(day.id)} className="min-w-0 flex-1 text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">{day.weekday}</p>
                  <h2 className="truncate text-lg font-black">{personalRest ? "Rest day" : defaultDayName(day)}</h2>
                  <p className="text-xs capitalize text-neutral-500">{fixedRest ? "Fixed weekly rest" : personalRest ? `${day.exercises.length} exercises kept for later` : `${day.workoutType} · ${day.exercises.length} exercises · usually 2 sets`}</p>
                </button>
                <DaySettings day={day} canEdit={canEdit && !personalRest} onSave={(type, name) => saveDay(day, type, name)} />
              </div>
              {personalRest ? <p className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-semibold text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">This is a personal rest day. The exercises below are kept and return when you remove the rest day.</p> : null}
            </header>

            {open && !fixedRest ? (
              <div className="border-t p-4">
                <ul className="space-y-2">
                  {day.exercises.map((item, index) => (
                    <ExerciseEditor key={item.id} item={item} index={index} count={day.exercises.length} canEdit={canEdit} onReload={load} onError={setError} />
                  ))}
                </ul>

                {day.exercises.length === 0 ? <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-neutral-500">No exercises yet. Add the movements you actually use.</p> : null}

                {canEdit ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex gap-2">
                      <select value={selectedExerciseByDay[day.id] ?? ""} onChange={(event) => setSelectedExerciseByDay((current) => ({ ...current, [day.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border bg-transparent px-3 py-3 text-sm">
                        <option value="">Choose an exercise…</option>
                        {available.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                      </select>
                      <button type="button" disabled={!selectedExerciseByDay[day.id] || busyDay === day.id} onClick={() => void add(day)} className="inline-flex items-center gap-1 rounded-xl bg-lime-300 px-4 py-3 text-sm font-black text-neutral-950 disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setCustomDayId(customDayId === day.id ? null : day.id)} className="rounded-xl border px-3 py-3 text-sm font-black">Create custom exercise</button>
                      <button type="button" disabled={day.exercises.length === 0 || busyDay === day.id} onClick={() => void clearDay(day)} className="rounded-xl border px-3 py-3 text-sm font-black text-red-600 disabled:opacity-40">Clear day</button>
                    </div>
                    {customDayId === day.id ? <CustomExerciseForm defaultWorkoutType={customDefaultType} onCreated={(exercise) => add(day, exercise)} onCancel={() => setCustomDayId(null)} /> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>
        );
      })}
    </div>
  );
}
