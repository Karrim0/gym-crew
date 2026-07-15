"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  Check,
  Dumbbell,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Trash2,
} from "lucide-react";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { CustomExerciseForm } from "@/features/exercises/components/CustomExerciseForm";
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
  updateSplitDaySettings,
  updateSplitExerciseTargets,
} from "../services/split.service";

interface SplitManagerProps {
  mode: "group" | "personal";
  groupId: UUID;
  userId: UUID;
  role: GroupRole;
}

const SHORT_DAY: Record<Weekday, string> = {
  saturday: "Sat",
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

const DAY_BY_JS_INDEX: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const WORKOUT_TYPE_OPTIONS: Array<{ value: WorkoutType; label: string }> = [
  { value: "push", label: "Push" },
  { value: "pull", label: "Pull" },
  { value: "legs", label: "Legs" },
  { value: "custom", label: "Custom" },
  { value: "rest", label: "Rest" },
];

function defaultDayName(day: SplitDayWithDetails) {
  if (day.workoutType === "rest") return "Rest day";
  if (day.displayName) return day.displayName;
  return `${day.workoutType.charAt(0).toUpperCase()}${day.workoutType.slice(1)} day`;
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
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
      await onReload();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to update the exercise.");
    } finally {
      setBusy(false);
    }
  }

  async function saveTargets() {
    if (!Number.isFinite(sets) || !Number.isFinite(min) || !Number.isFinite(max)) {
      onError("Enter valid set and rep targets.");
      return;
    }
    await run(() => updateSplitExerciseTargets(item.id, {
      targetSets: sets,
      targetRepsMin: min,
      targetRepsMax: max,
    }));
    setEditing(false);
  }

  return (
    <li className="rounded-2xl border border-white/[0.07] bg-white/[0.025] p-3.5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-sm font-bold">{index + 1}</span>
        <button type="button" onClick={() => canEdit && setEditing((value) => !value)} className="min-w-0 flex-1 text-left">
          <p className="truncate font-bold">{item.exercise.name}</p>
          <p className="mt-0.5 truncate text-xs capitalize text-neutral-500">{item.targetSets} sets · {item.targetRepsMin}–{item.targetRepsMax} reps · {item.exercise.primaryMuscle}</p>
        </button>
        {canEdit ? (
          <details className="relative">
            <summary className="grid h-9 w-9 list-none place-items-center rounded-full border border-white/[0.08] text-neutral-400 [&::-webkit-details-marker]:hidden" aria-label="Exercise options"><MoreVertical className="h-4 w-4" /></summary>
            <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-white/[0.09] bg-[#171b25] p-1.5 shadow-2xl">
              <button type="button" disabled={busy || index === 0} onClick={() => void run(() => moveSplitExercise(item.id, -1))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-30"><ArrowUp className="h-4 w-4" /> Move up</button>
              <button type="button" disabled={busy || index === count - 1} onClick={() => void run(() => moveSplitExercise(item.id, 1))} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm disabled:opacity-30"><ArrowDown className="h-4 w-4" /> Move down</button>
              <button type="button" disabled={busy} onClick={() => {
                if (window.confirm(`Remove ${item.exercise.name} from this day?`)) void run(() => removeSplitExercise(item.id));
              }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300"><Trash2 className="h-4 w-4" /> Remove</button>
            </div>
          </details>
        ) : null}
      </div>

      {editing ? (
        <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
          <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Sets<input type="number" inputMode="numeric" min={1} max={20} value={sets} onChange={(event) => setSets(event.target.valueAsNumber)} className="gc-input mt-1 min-h-11 text-center text-lg font-bold" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Min reps<input type="number" inputMode="numeric" min={1} max={100} value={min} onChange={(event) => setMin(event.target.valueAsNumber)} className="gc-input mt-1 min-h-11 text-center text-lg font-bold" /></label>
          <label className="text-[10px] font-bold uppercase tracking-wide text-neutral-500">Max reps<input type="number" inputMode="numeric" min={1} max={100} value={max} onChange={(event) => setMax(event.target.valueAsNumber)} className="gc-input mt-1 min-h-11 text-center text-lg font-bold" /></label>
          <button type="button" disabled={busy} onClick={() => void saveTargets()} className="gc-primary-button col-span-3 min-h-11"><Save className="h-4 w-4" /> Save targets</button>
        </div>
      ) : null}
    </li>
  );
}

export function SplitManager({ mode, groupId, userId, role }: SplitManagerProps) {
  const searchParams = useSearchParams();
  const requestedWeekday = searchParams.get("day") as Weekday | null;
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = mode === "personal" || role === "owner" || role === "admin";

  const fetchDays = useCallback(
    () => mode === "group" ? fetchGroupSplit(groupId) : fetchPersonalSplit(userId),
    [groupId, mode, userId],
  );

  const reloadDays = useCallback(async () => {
    const nextDays = await fetchDays();
    setDays(nextDays);
    setSelectedDayId((current) => current && nextDays.some((day) => day.id === current) ? current : nextDays[0]?.id ?? null);
  }, [fetchDays]);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchDays(), fetchExerciseLibrary()])
      .then(([nextDays, nextLibrary]) => {
        if (!active) return;
        setDays(nextDays);
        setLibrary(nextLibrary);
        const preferredWeekday = requestedWeekday && WEEKDAYS_STARTING_SATURDAY.includes(requestedWeekday)
          ? requestedWeekday
          : DAY_BY_JS_INDEX[new Date().getDay()];
        setSelectedDayId(nextDays.find((day) => day.weekday === preferredWeekday)?.id ?? nextDays[0]?.id ?? null);
      })
      .catch((caught) => {
        if (active) setError(caught instanceof Error ? caught.message : "Unable to load the split.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [fetchDays, requestedWeekday]);

  const orderedDays = useMemo(
    () => [...days].sort((a, b) => WEEKDAYS_STARTING_SATURDAY.indexOf(a.weekday) - WEEKDAYS_STARTING_SATURDAY.indexOf(b.weekday)),
    [days],
  );
  const selectedDay = orderedDays.find((day) => day.id === selectedDayId) ?? orderedDays[0] ?? null;

  const availableExercises = useMemo(() => {
    if (!selectedDay) return [];
    return library.filter((exercise) => {
      const typeMatches = selectedDay.workoutType === "custom" || selectedDay.workoutType === "rest" || exercise.workoutType === selectedDay.workoutType || exercise.workoutType === "custom";
      return typeMatches && !selectedDay.exercises.some((item) => item.exerciseId === exercise.id);
    });
  }, [library, selectedDay]);

  async function saveDaySettings(workoutType: WorkoutType, displayName = selectedDay?.displayName ?? "") {
    if (!selectedDay) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      await updateSplitDaySettings(selectedDay.id, workoutType, displayName);
      await reloadDays();
      setMessage(workoutType === "rest" ? `${SHORT_DAY[selectedDay.weekday]} is now a rest day. Its exercises are kept.` : `${SHORT_DAY[selectedDay.weekday]} updated.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the day.");
    } finally {
      setBusy(false);
    }
  }

  async function addExercise(exercise = library.find((item) => item.id === selectedExercise)) {
    if (!selectedDay || !exercise || selectedDay.workoutType === "rest") return;
    setBusy(true);
    setError(null);
    try {
      await addSplitExercise({ splitDayId: selectedDay.id, exercise, targetSets: 2, isPersonalAddition: mode === "personal" });
      setSelectedExercise("");
      setShowCustomExercise(false);
      await reloadDays();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add the exercise.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm("Reset your personal split to the current crew starting plan?")) return;
    setBusy(true);
    setError(null);
    try {
      await resetPersonalSplitToGroup(userId);
      await reloadDays();
      setMessage("Your split was reset to the crew plan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset the split.");
    } finally {
      setBusy(false);
    }
  }

  async function clearDay() {
    if (!selectedDay || !window.confirm(`Remove every exercise from ${defaultDayName(selectedDay)}?`)) return;
    setBusy(true);
    try {
      await clearSplitDay(selectedDay.id);
      await reloadDays();
      setMessage("The day is empty. You can add only the exercises you need.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to clear the day.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="h-72 animate-pulse rounded-[24px] border border-white/[0.06] bg-white/[0.035]" />;
  if (!selectedDay) return <p className="gc-card p-5 text-sm text-neutral-400">No split days are available yet.</p>;

  return (
    <div className="space-y-4 pb-20 pt-4">
      <section className="gc-card p-4 sm:p-5">
        <p className="gc-eyebrow">Your schedule</p>
        <h2 className="mt-1 text-xl font-bold">Build the week around you</h2>
        <p className="mt-1 text-sm leading-5 text-neutral-500">Every day is flexible. Choose training or recovery, then edit only the day you are working on.</p>

        <div className="mt-4 grid grid-cols-7 gap-1.5" role="tablist" aria-label="Choose split day">
          {orderedDays.map((day) => {
            const active = day.id === selectedDay.id;
            const rest = day.workoutType === "rest";
            return (
              <button key={day.id} type="button" role="tab" aria-selected={active} onClick={() => {
                setSelectedDayId(day.id);
                setSelectedExercise("");
                setShowCustomExercise(false);
                setMessage(null);
              }} className={`min-w-0 rounded-xl border px-1 py-2.5 text-center transition ${active ? "border-indigo-300/55 bg-indigo-300 text-[#11131a]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                <span className={`block text-[10px] font-bold uppercase ${active ? "text-[#11131a]/65" : "text-neutral-500"}`}>{SHORT_DAY[day.weekday]}</span>
                <span className={`mt-1 block truncate text-[10px] font-semibold sm:text-xs ${active ? "text-[#11131a]" : rest ? "text-neutral-500" : "text-neutral-200"}`}>{rest ? "Rest" : day.workoutType}</span>
              </button>
            );
          })}
        </div>

        {mode === "personal" ? <button type="button" disabled={busy} onClick={() => void reset()} className="gc-secondary-button mt-4"><RotateCcw className="h-4 w-4" /> Reset to crew split</button> : null}
      </section>

      {error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-300">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-300">{message}</p> : null}

      <section className="gc-card overflow-visible">
        <div className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="gc-eyebrow">{selectedDay.weekday}</p>
              <h2 className="mt-1 text-2xl font-bold">{defaultDayName(selectedDay)}</h2>
              <p className="mt-1 text-sm text-neutral-500">{selectedDay.workoutType === "rest" ? `${selectedDay.exercises.length} saved exercises will return when you make this a training day.` : `${selectedDay.exercises.length} exercises · targets can be changed anytime.`}</p>
            </div>
            <span className={`grid h-11 w-11 place-items-center rounded-2xl ${selectedDay.workoutType === "rest" ? "bg-white/[0.05] text-neutral-400" : "bg-indigo-300/12 text-indigo-200"}`}><Dumbbell className="h-5 w-5" /></span>
          </div>

          {canEdit ? (
            <fieldset className="mt-4">
              <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Day type</legend>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                {WORKOUT_TYPE_OPTIONS.map((option) => {
                  const active = selectedDay.workoutType === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={active}
                      disabled={busy || active}
                      onClick={() => void saveDaySettings(option.value, selectedDay.displayName ?? "")}
                      className={`flex min-h-11 items-center justify-center gap-1.5 rounded-xl border px-3 text-sm font-bold transition disabled:cursor-default ${
                        active
                          ? "border-indigo-300/55 bg-indigo-300 text-[#11131a] shadow-[0_8px_22px_rgba(85,101,205,.16)]"
                          : "border-white/[0.08] bg-white/[0.025] text-neutral-300 hover:border-indigo-300/25 hover:bg-indigo-300/[0.07]"
                      }`}
                    >
                      {active ? <Check className="h-4 w-4" aria-hidden /> : null}
                      {option.label}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2 text-xs leading-5 text-neutral-500">Choose the exact kind of session for this day. Rest keeps the exercises saved.</p>
            </fieldset>
          ) : null}

          {canEdit && selectedDay.workoutType !== "rest" ? (
            <label className="mt-3 block text-xs font-bold uppercase tracking-wide text-neutral-500">Day name
              <div className="mt-1 flex gap-2">
                <input key={`${selectedDay.id}:${selectedDay.displayName}`} defaultValue={selectedDay.displayName ?? ""} maxLength={40} placeholder="e.g. Back & biceps" className="gc-input min-w-0 flex-1" id={`day-name-${selectedDay.id}`} />
                <button type="button" disabled={busy} onClick={() => {
                  const input = document.getElementById(`day-name-${selectedDay.id}`) as HTMLInputElement | null;
                  void saveDaySettings(selectedDay.workoutType, input?.value ?? "");
                }} className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-300 text-[#11131a]" aria-label="Save day name"><Save className="h-4 w-4" /></button>
              </div>
            </label>
          ) : null}
        </div>

        {selectedDay.workoutType === "rest" ? (
          <div className="border-t border-white/[0.06] p-4 sm:p-5">
            <div className="rounded-2xl border border-dashed border-white/[0.1] p-5 text-center">
              <p className="font-bold">Recovery day</p>
              <p className="mt-1 text-sm text-neutral-500">Nothing is deleted. Pick a workout type above whenever you want to train on this day again.</p>
            </div>
          </div>
        ) : (
          <div className="border-t border-white/[0.06] p-4 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div><h3 className="font-bold">Exercises</h3><p className="text-xs text-neutral-500">Tap an exercise to edit sets and reps.</p></div>
              <span className="gc-chip">{selectedDay.exercises.length}</span>
            </div>

            <ul className="space-y-2">
              {selectedDay.exercises.map((item, index) => <ExerciseEditor key={`${item.id}:${item.targetSets}:${item.targetRepsMin}:${item.targetRepsMax}`} item={item} index={index} count={selectedDay.exercises.length} canEdit={canEdit} onReload={reloadDays} onError={setError} />)}
            </ul>

            {selectedDay.exercises.length === 0 ? <p className="rounded-2xl border border-dashed border-white/[0.1] p-5 text-center text-sm text-neutral-500">This day is empty. Add the movements you actually use in the gym.</p> : null}

            {canEdit ? (
              <div className="mt-4 space-y-3">
                <div className="flex gap-2">
                  <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="gc-input min-w-0 flex-1 text-sm">
                    <option value="">Choose an exercise…</option>
                    {availableExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}
                  </select>
                  <button type="button" disabled={!selectedExercise || busy} onClick={() => void addExercise()} className="gc-primary-button min-h-12 px-4 disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setShowCustomExercise((value) => !value)} className="gc-secondary-button"><Plus className="h-4 w-4" /> Custom exercise</button>
                  <button type="button" disabled={selectedDay.exercises.length === 0 || busy} onClick={() => void clearDay()} className="gc-secondary-button text-red-300 disabled:opacity-40"><Trash2 className="h-4 w-4" /> Clear day</button>
                </div>
                {showCustomExercise ? <CustomExerciseForm defaultWorkoutType={selectedDay.workoutType} onCreated={addExercise} onCancel={() => setShowCustomExercise(false)} /> : null}
              </div>
            ) : null}
          </div>
        )}
      </section>
    </div>
  );
}
