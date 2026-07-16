"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ListPlus,
  LogOut,
  History,
  MessageSquareText,
  MoreHorizontal,
  Plus,
  Save,
  TimerReset,
  TrendingDown,
  TrendingUp,
  Trash2,
  XCircle,
} from "lucide-react";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { useRestTimer } from "@/contexts/rest-timer-context";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { CustomExerciseForm } from "@/features/exercises/components/CustomExerciseForm";
import { addSplitExercise } from "@/features/splits/services/split.service";
import type { Exercise, WorkoutSet } from "@/types";
import { formatDuration } from "@/lib/utils/format";
import { useActiveWorkout } from "../hooks/use-active-workout";
import { usePreviousPerformances } from "../hooks/use-previous-performance";
import {
  addExerciseToWorkout,
  addWorkoutSet,
  cancelWorkoutSession,
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
  onCompleted: () => void;
  onDraftChange: (setId: string, draft: { weight: string; reps: string }) => void;
  onDraftSaved: (setId: string) => void;
  onError: (message: string) => void;
}

function parseOptionalNumber(value: string) {
  if (value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1).replace(/\.0$/, "");
}

function formatWorkoutDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00`));
}

function getSetChanges(set: WorkoutSet, previousSet?: WorkoutSet) {
  if (!set.isCompleted || !previousSet) return [];

  const changes: Array<{ label: string; direction: "up" | "down" | "same" }> = [];
  if (set.weightKg !== null && previousSet.weightKg !== null) {
    const difference = set.weightKg - previousSet.weightKg;
    if (difference !== 0) {
      changes.push({
        label: `${difference > 0 ? "+" : ""}${formatNumber(difference)} kg`,
        direction: difference > 0 ? "up" : "down",
      });
    }
  }
  if (set.reps !== null && previousSet.reps !== null) {
    const difference = set.reps - previousSet.reps;
    if (difference !== 0) {
      changes.push({
        label: `${difference > 0 ? "+" : ""}${difference} ${Math.abs(difference) === 1 ? "rep" : "reps"}`,
        direction: difference > 0 ? "up" : "down",
      });
    }
  }

  if (changes.length === 0) {
    changes.push({ label: "Matched last time", direction: "same" });
  }
  return changes;
}

function SetEditor({
  set,
  previousSet,
  onDelete,
  onSaved,
  onCompleted,
  onDraftChange,
  onDraftSaved,
  onError,
}: SetEditorProps) {
  const [weight, setWeight] = useState(
    set.weightKg?.toString() ?? previousSet?.weightKg?.toString() ?? "",
  );
  const [reps, setReps] = useState(
    set.reps?.toString() ?? previousSet?.reps?.toString() ?? "",
  );
  const [saving, setSaving] = useState(false);
  const changes = getSetChanges(set, previousSet);
  const isSuggested = Boolean(
    previousSet &&
      !set.isCompleted &&
      set.weightKg === null &&
      set.reps === null,
  );

  async function save(nextCompleted: boolean) {
    const weightKg = parseOptionalNumber(weight);
    const repsValue = parseOptionalNumber(reps);
    if (Number.isNaN(weightKg) || (weightKg !== null && weightKg < 0)) {
      onError("Enter a valid weight.");
      return;
    }
    if (Number.isNaN(repsValue) || (repsValue !== null && (!Number.isInteger(repsValue) || repsValue < 0))) {
      onError("Reps must be a valid whole number.");
      return;
    }
    if (nextCompleted && (repsValue === null || repsValue <= 0)) {
      onError("Add your reps before completing the set.");
      return;
    }

    setSaving(true);
    try {
      await updateWorkoutSet(set.id, {
        weightKg,
        reps: repsValue,
        isCompleted: nextCompleted,
      });
      onDraftSaved(set.id);
      await onSaved();
      if (nextCompleted && !set.isCompleted) onCompleted();
    } catch (caught) {
      onError(caught instanceof Error ? caught.message : "Unable to save the set.");
    } finally {
      setSaving(false);
    }
  }

  function restorePrevious() {
    if (!previousSet) return;
    const nextWeight = previousSet.weightKg?.toString() ?? "";
    const nextReps = previousSet.reps?.toString() ?? "";
    setWeight(nextWeight);
    setReps(nextReps);
    onDraftChange(set.id, { weight: nextWeight, reps: nextReps });
  }

  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 transition ${
        set.isCompleted
          ? "border-emerald-400/35 bg-emerald-400/[0.06]"
          : "border-white/[0.07] bg-white/[0.025]"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${
            set.isCompleted
              ? "bg-emerald-400 text-[#101319]"
              : "bg-white/[0.06] text-neutral-300"
          }`}
        >
          {set.setNumber}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-sm font-bold">Working set {set.setNumber}</p>
              {previousSet ? (
                <button
                  type="button"
                  onClick={restorePrevious}
                  className="mt-0.5 text-left text-xs font-semibold text-indigo-200 hover:text-indigo-100"
                >
                  Last: {previousSet.weightKg ?? "—"} kg × {previousSet.reps ?? "—"} · tap to restore
                </button>
              ) : (
                <p className="mt-0.5 text-xs text-neutral-500">First log for this set</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Delete this set?")) void onDelete();
              }}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-red-400/10 hover:text-red-300"
              aria-label="Delete set"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>

          {isSuggested ? (
            <p className="mt-2 rounded-lg bg-indigo-300/[0.08] px-2.5 py-1.5 text-[11px] font-semibold text-indigo-100">
              Last workout is ready. Change only what changed, or tap ✓ to repeat it.
            </p>
          ) : null}

          {changes.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {changes.map((change) => (
                <span
                  key={`${change.direction}:${change.label}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-bold ${
                    change.direction === "up"
                      ? "bg-emerald-400/10 text-emerald-300"
                      : change.direction === "down"
                        ? "bg-amber-300/10 text-amber-200"
                        : "bg-white/[0.06] text-neutral-300"
                  }`}
                >
                  {change.direction === "up" ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : change.direction === "down" ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : null}
                  {change.label}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)_3rem] gap-2">
        <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          <span className="block">Weight</span>
          <div className="mt-1 flex min-h-12 w-full min-w-0 items-center overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 focus-within:border-indigo-300/60">
            <input
              inputMode="decimal"
              type="number"
              min={0}
              step="0.5"
              value={weight}
              onChange={(event) => {
                const nextWeight = event.target.value;
                setWeight(nextWeight);
                onDraftChange(set.id, { weight: nextWeight, reps });
              }}
              className="w-0 min-w-0 flex-1 bg-transparent py-2 text-center text-xl font-bold tabular-nums outline-none"
              aria-label={`Weight for set ${set.setNumber}`}
            />
            <span className="text-xs font-bold text-neutral-500">kg</span>
          </div>
        </label>
        <label className="min-w-0 text-[10px] font-bold uppercase tracking-wide text-neutral-500">
          <span className="block">Reps</span>
          <input
            inputMode="numeric"
            type="number"
            min={0}
            step={1}
            value={reps}
            onChange={(event) => {
              const nextReps = event.target.value;
              setReps(nextReps);
              onDraftChange(set.id, { weight, reps: nextReps });
            }}
            className="mt-1 min-h-12 w-full min-w-0 max-w-full rounded-xl border border-white/[0.08] bg-white/[0.035] px-2 text-center text-xl font-bold tabular-nums outline-none focus:border-indigo-300/60"
            aria-label={`Reps for set ${set.setNumber}`}
          />
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save(!set.isCompleted)}
          className={`mt-[1.35rem] grid h-12 w-12 place-items-center rounded-xl transition ${
            set.isCompleted
              ? "bg-emerald-400 text-[#101319]"
              : "bg-indigo-300 text-[#11131a]"
          }`}
          aria-label={set.isCompleted ? "Mark set incomplete" : "Complete set"}
        >
          {saving ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <Check className="h-5 w-5" />
          )}
        </button>
      </div>
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
  const [setDrafts, setSetDrafts] = useState<Record<string, { weight: string; reps: string }>>({});
  const [error, setError] = useState<string | null>(null);
  const initializedSession = useRef<string | null>(null);

  useEffect(() => {
    void fetchExerciseLibrary().then(setLibrary).catch(() => setLibrary([]));
  }, []);

  useEffect(() => {
    if (!session || initializedSession.current === session.id) return;
    initializedSession.current = session.id;
    setSessionNotes(session.notes);
    const firstIncomplete = session.exercises.findIndex((exercise) => exercise.sets.some((set) => !set.isCompleted));
    setCurrentIndex(firstIncomplete >= 0 ? firstIncomplete : 0);
    restTimer.setScope(session.id);
  }, [restTimer, session]);

  const exerciseIds = useMemo(
    () => session?.exercises.map((exercise) => exercise.exerciseId) ?? [],
    [session],
  );
  const { performances, isLoading: previousPerformanceLoading } = usePreviousPerformances(exerciseIds);
  const currentExercise = session?.exercises[currentIndex] ?? null;
  const previousPerformance = currentExercise
    ? performances[currentExercise.exerciseId]
    : undefined;
  const previousSets = previousPerformance?.sets ?? [];

  const totals = useMemo(() => {
    const exercises = session?.exercises ?? [];
    const totalSets = exercises.reduce((sum, exercise) => sum + exercise.sets.length, 0);
    const completedSets = exercises.reduce((sum, exercise) => sum + exercise.sets.filter((set) => set.isCompleted).length, 0);
    const completedExercises = exercises.filter((exercise) => exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted)).length;
    return { totalSets, completedSets, completedExercises };
  }, [session]);

  function updateSetDraft(setId: string, draft: { weight: string; reps: string }) {
    setSetDrafts((current) => ({ ...current, [setId]: draft }));
  }

  function removeSetDraft(setId: string) {
    setSetDrafts((current) => {
      if (!(setId in current)) return current;
      const next = { ...current };
      delete next[setId];
      return next;
    });
  }

  async function persistSetDrafts() {
    if (!session) return;
    const allSets = session.exercises.flatMap((exercise) => exercise.sets);
    const updates = Object.entries(setDrafts).map(([setId, draft]) => {
      const existing = allSets.find((set) => set.id === setId);
      if (!existing) return null;
      const weightKg = parseOptionalNumber(draft.weight);
      const reps = parseOptionalNumber(draft.reps);
      if (Number.isNaN(weightKg) || (weightKg !== null && weightKg < 0)) {
        throw new Error("Enter a valid weight before leaving the workout.");
      }
      if (Number.isNaN(reps) || (reps !== null && (!Number.isInteger(reps) || reps < 0))) {
        throw new Error("Reps must be a valid whole number before leaving the workout.");
      }
      return updateWorkoutSet(setId, {
        weightKg,
        reps,
        isCompleted: existing.isCompleted,
      });
    });
    await Promise.all(updates.filter((update): update is Promise<WorkoutSet> => update !== null));
    setSetDrafts({});
  }

  async function leaveWorkout() {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await persistSetDrafts();
      await updateWorkoutSessionNotes(session.id, sessionNotes);
      router.push("/dashboard");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save the workout before leaving.");
    } finally {
      setBusy(false);
    }
  }

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
      removeSetDraft(setId);
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

  async function finish() {
    if (!session) return;
    const incompleteSets = totals.totalSets - totals.completedSets;
    if (incompleteSets > 0 && !window.confirm(`${incompleteSets} sets are not completed. Finish the workout anyway?`)) return;
    setBusy(true);
    setError(null);
    try {
      await persistSetDrafts();
      await updateWorkoutSessionNotes(session.id, sessionNotes);
      const durationSeconds = Math.max(0, Math.floor((Date.now() - new Date(session.startedAt).getTime()) / 1000));
      await finishWorkoutSession(session.id, durationSeconds, sessionNotes);
      restTimer.clear();
      restTimer.setScope(null);
      router.replace(`/workout/${session.id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to finish the workout.");
    } finally {
      setBusy(false);
    }
  }

  async function discard() {
    if (!session || !window.confirm("Discard this workout? All sets in this active session will be excluded from progress.")) return;
    setBusy(true);
    try {
      await cancelWorkoutSession(session.id);
      restTimer.clear();
      restTimer.setScope(null);
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to discard the workout.");
      setBusy(false);
    }
  }

  if (isLoading) return <div className="h-72 animate-pulse rounded-[24px] border border-white/[0.06] bg-white/[0.035]" />;
  if (loadError || !session || !currentExercise) return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{loadError?.message ?? "No active workout found."}</p>;

  const currentComplete = currentExercise.sets.length > 0 && currentExercise.sets.every((set) => set.isCompleted);
  const progress = totals.totalSets > 0 ? (totals.completedSets / totals.totalSets) * 100 : 0;
  const exerciseCount = session.exercises.length;
  const availableExercises = library.filter((exercise) => !session.exercises.some((item) => item.exerciseId === exercise.id));

  function move(direction: -1 | 1) {
    setCurrentIndex((current) => Math.min(exerciseCount - 1, Math.max(0, current + direction)));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="mx-auto w-full min-w-0 max-w-xl space-y-4 pb-[calc(8rem+env(safe-area-inset-bottom,0px))] pt-2">
      <section className="gc-workout-sticky sticky z-30 -mx-4 border-b border-white/[0.06] px-4 pb-3 pt-2 backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-indigo-200">Gym mode</p>
            <SessionElapsedTime startedAt={session.startedAt} compact />
          </div>
          <button type="button" disabled={busy} onClick={() => void leaveWorkout()} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 text-xs font-bold disabled:opacity-50"><LogOut className="h-4 w-4" /> Save & leave</button>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-indigo-300 transition-all duration-300" style={{ width: `${progress}%` }} /></div>
        <div className="mt-2 flex items-center justify-between text-xs font-semibold text-neutral-500"><span>{totals.completedSets}/{totals.totalSets} sets</span><span>{totals.completedExercises}/{session.exercises.length} exercises</span></div>
      </section>

      {error ? <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-300">{error}</p> : null}

      <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Current exercise
        <select value={currentIndex} onChange={(event) => setCurrentIndex(Number(event.target.value))} className="gc-input mt-1 text-sm font-bold">
          {session.exercises.map((exercise, index) => {
            const done = exercise.sets.length > 0 && exercise.sets.every((set) => set.isCompleted);
            return <option key={exercise.id} value={index}>{done ? "✓ " : ""}{index + 1}. {exercise.exercise.name}</option>;
          })}
        </select>
      </label>

      <section className="gc-card min-w-0 overflow-hidden">
        <div className="bg-[linear-gradient(135deg,rgba(139,158,255,.13),rgba(23,27,37,.98)_58%)] p-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.15em] opacity-55">Exercise {currentIndex + 1} of {session.exercises.length}</p>
              <h1 className="mt-1 truncate text-2xl font-bold">{currentExercise.exercise.name}</h1>
              <p className="mt-1 text-sm capitalize opacity-60">{currentExercise.exercise.primaryMuscle}{currentExercise.isSessionOnlyAddition ? " · session only" : ""}</p>
            </div>
            <details className="relative">
              <summary className="grid h-10 w-10 list-none place-items-center rounded-full bg-white/[0.06] [&::-webkit-details-marker]:hidden" aria-label="Exercise options"><MoreHorizontal className="h-5 w-5" /></summary>
              <div className="absolute right-0 top-12 z-20 w-48 rounded-xl border border-white/[0.1] bg-[#171b25] p-1.5 shadow-2xl">
                <button type="button" onClick={() => {
                  if (!window.confirm("Remove this exercise from the active workout?")) return;
                  void deleteWorkoutExercise(currentExercise.id).then(async () => {
                    await reload();
                    setCurrentIndex((index) => Math.max(0, Math.min(index, session.exercises.length - 2)));
                  }).catch((caught: Error) => setError(caught.message));
                }} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-300"><Trash2 className="h-4 w-4" /> Remove exercise</button>
              </div>
            </details>
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.08] bg-black/10 p-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.06] text-indigo-100">
                <History className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                {previousPerformanceLoading ? (
                  <>
                    <p className="text-sm font-bold">Loading your last workout…</p>
                    <p className="mt-0.5 text-xs opacity-55">Your previous weights and reps will appear automatically.</p>
                  </>
                ) : previousPerformance ? (
                  <>
                    <p className="text-sm font-bold">
                      Last workout · {formatWorkoutDate(previousPerformance.scheduledDate)}
                    </p>
                    <p className="mt-0.5 text-xs opacity-60">
                      Those numbers are already loaded below. Change only what changed today.
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold">First time logging this exercise</p>
                    <p className="mt-0.5 text-xs opacity-55">Complete your sets today and they will become next workout&apos;s baseline.</p>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowNotes((value) => !value)}
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white/[0.06] px-3 text-xs font-semibold"
              >
                <MessageSquareText className="h-4 w-4" /> Notes
              </button>
            </div>
            {previousPerformance?.exerciseNotes ? (
              <p className="mt-3 rounded-xl bg-white/[0.045] px-3 py-2 text-xs leading-5 text-neutral-300">
                <span className="font-bold text-white">Last note:</span> {previousPerformance.exerciseNotes}
              </p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 p-4">
          {currentExercise.sets.map((set, index) => {
            const previousSet = previousSets[index];
            return (
              <SetEditor
                key={`${set.id}:${set.updatedAt}:${previousSet?.id ?? "no-previous"}`}
                set={set}
                previousSet={previousSet}
                onDelete={() => removeSet(set.id)}
                onSaved={reload}
                onCompleted={() => restTimer.start(restTimer.durationSeconds)}
                onDraftChange={updateSetDraft}
                onDraftSaved={removeSetDraft}
                onError={setError}
              />
            );
          })}

          <button type="button" onClick={() => void addSet(currentExercise.id)} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 text-sm font-semibold text-neutral-300"><Plus className="h-4 w-4" /> Add working set</button>

          {showNotes ? <textarea defaultValue={currentExercise.notes} onBlur={(event) => void updateWorkoutExerciseNotes(currentExercise.id, event.target.value).catch((caught: Error) => setError(caught.message))} rows={3} placeholder="Setup, cues, machine position…" className="gc-input text-sm" /> : null}
        </div>
      </section>

      <button type="button" onClick={restTimer.open} className="gc-card-interactive flex w-full items-center gap-3 p-4 text-left">
        <span className={`grid h-11 w-11 place-items-center rounded-xl ${restTimer.isRunning ? "bg-indigo-300 text-[#11131a]" : "bg-white/[0.06] text-indigo-200"}`}><TimerReset className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1"><span className="block font-bold">{restTimer.isRunning ? `${formatDuration(restTimer.remainingSeconds)} rest remaining` : `Rest timer · ${formatDuration(restTimer.durationSeconds)}`}</span><span className="block text-xs text-neutral-500">Starts automatically after a completed set</span></span>
        <ChevronRight className="h-5 w-5 text-neutral-500" />
      </button>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button type="button" disabled={currentIndex === 0} onClick={() => move(-1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-white/[0.08] font-semibold disabled:opacity-30"><ChevronLeft className="h-5 w-5" /> Previous</button>
        <span className={`grid h-12 w-12 place-items-center rounded-full ${currentComplete ? "bg-emerald-400 text-[#11131a]" : "bg-white/[0.06]"}`}>{currentComplete ? <Check className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}</span>
        <button type="button" disabled={currentIndex === session.exercises.length - 1} onClick={() => move(1)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-300 font-semibold text-[#11131a] disabled:opacity-30">Next <ChevronRight className="h-5 w-5" /></button>
      </div>

      <section className="gc-card p-4">
        <button type="button" onClick={() => setShowExercisePicker((value) => !value)} className="flex w-full items-center gap-3 text-left">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.06]"><ListPlus className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-bold">Add another exercise</span><span className="text-xs text-neutral-500">Session only or save it to your split</span></span>
          <MoreHorizontal className="h-5 w-5" />
        </button>

        {showExercisePicker ? (
          <div className="mt-4 space-y-3">
            <select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="gc-input text-sm"><option value="">Choose exercise…</option>{availableExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select>
            <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={permanent} onChange={(event) => setPermanent(event.target.checked)} /> Also add it permanently to this split day</label>
            {!isOnline && permanent ? <p className="text-xs font-semibold text-amber-300">Permanent split changes need internet. It will still be saved in this session.</p> : null}
            <button type="button" disabled={!selectedExercise || busy} onClick={() => void addExercise()} className="gc-primary-button w-full disabled:opacity-40"><Plus className="h-4 w-4" /> Add with 2 sets</button>
            <button type="button" onClick={() => setShowCustomExercise((value) => !value)} className="gc-secondary-button w-full">Create a custom exercise</button>
            {showCustomExercise ? <CustomExerciseForm compact defaultWorkoutType="custom" onCreated={addExercise} onCancel={() => setShowCustomExercise(false)} /> : null}
          </div>
        ) : null}
      </section>

      <section className="gc-card p-4">
        <label className="text-sm font-bold">Session notes<textarea value={sessionNotes} onChange={(event) => setSessionNotes(event.target.value)} onBlur={() => void updateWorkoutSessionNotes(session.id, sessionNotes)} rows={3} className="gc-input mt-2 font-normal" placeholder="Energy, pain-free adjustments, anything worth remembering…" /></label>
      </section>

      <button type="button" disabled={busy} onClick={() => void finish()} className="inline-flex min-h-16 w-full items-center justify-center gap-2 rounded-[18px] bg-indigo-300 px-4 text-lg font-bold text-[#11131a] shadow-lg shadow-indigo-500/15 disabled:opacity-50"><Save className="h-5 w-5" /> {busy ? "Finishing…" : "Finish workout"}</button>
      <button type="button" disabled={busy} onClick={() => void discard()} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold text-red-300 disabled:opacity-40"><XCircle className="h-4 w-4" /> Discard workout</button>
    </div>
  );
}
