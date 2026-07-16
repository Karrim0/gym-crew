"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowDown,
  ArrowUp,
  Check,
  Dumbbell,
  Flame,
  Heart,
  Moon,
  MoreVertical,
  Plus,
  RotateCcw,
  Save,
  Shield,
  Target,
  Trash2,
  Zap,
} from "lucide-react";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import { fetchExerciseLibrary } from "@/features/exercises/services/exercise.service";
import { CustomExerciseForm } from "@/features/exercises/components/CustomExerciseForm";
import { getTodayISODate, getWeekdayFromDate, parseISODateOnly } from "@/lib/dates";
import type {
  Exercise,
  GroupRole,
  ISODateOnlyString,
  SplitDayColorKey,
  SplitDayIconKey,
  UUID,
  Weekday,
  WorkoutType,
} from "@/types";
import type { SplitDayWithDetails, SplitExerciseWithDetails, WeeklyScheduleDayWithDetails } from "../types";
import {
  addSplitExercise,
  clearSplitDay,
  fetchEffectiveWeekSchedule,
  fetchGroupSplit,
  fetchPersonalSplit,
  moveSplitExercise,
  removeSplitExercise,
  resetPersonalSplitToGroup,
  resetWeekSchedule,
  updateSplitDaySettings,
  updateSplitExerciseTargets,
  updateWeeklyScheduleDay,
} from "../services/split.service";
import { SplitSetupChooser } from "./SplitSetupChooser";

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

const LONG_DAY: Record<Weekday, string> = {
  saturday: "Saturday",
  sunday: "Sunday",
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
};

const ICONS: Record<SplitDayIconKey, typeof Dumbbell> = {
  dumbbell: Dumbbell,
  zap: Zap,
  target: Target,
  flame: Flame,
  shield: Shield,
  heart: Heart,
  moon: Moon,
  activity: Activity,
};

const ICON_OPTIONS: Array<{ key: SplitDayIconKey; label: string }> = [
  { key: "dumbbell", label: "Strength" },
  { key: "zap", label: "Power" },
  { key: "target", label: "Focus" },
  { key: "activity", label: "Full body" },
  { key: "flame", label: "Intensity" },
  { key: "shield", label: "Control" },
  { key: "heart", label: "Conditioning" },
  { key: "moon", label: "Recovery" },
];

const COLOR_OPTIONS: Array<{ key: SplitDayColorKey; className: string }> = [
  { key: "indigo", className: "bg-indigo-300" },
  { key: "blue", className: "bg-sky-300" },
  { key: "emerald", className: "bg-emerald-300" },
  { key: "amber", className: "bg-amber-300" },
  { key: "rose", className: "bg-rose-300" },
  { key: "violet", className: "bg-violet-300" },
];

const COLOR_TONES: Record<SplitDayColorKey, string> = {
  indigo: "border-indigo-300/35 bg-indigo-300/[0.09] text-indigo-200",
  blue: "border-sky-300/35 bg-sky-300/[0.09] text-sky-200",
  emerald: "border-emerald-300/35 bg-emerald-300/[0.09] text-emerald-200",
  amber: "border-amber-300/35 bg-amber-300/[0.09] text-amber-200",
  rose: "border-rose-300/35 bg-rose-300/[0.09] text-rose-200",
  violet: "border-violet-300/35 bg-violet-300/[0.09] text-violet-200",
};

const WORKOUT_FILTERS: Array<{ value: Exclude<WorkoutType, "rest">; label: string }> = [
  { value: "custom", label: "Custom" },
  { value: "push", label: "Push library" },
  { value: "pull", label: "Pull library" },
  { value: "legs", label: "Legs library" },
];

function titleFor(day: Pick<SplitDayWithDetails, "displayName" | "workoutType">) {
  return day.displayName?.trim() || (day.workoutType === "rest" ? "Recovery" : "Training day");
}

function dateCaption(value: ISODateOnlyString) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(parseISODateOnly(value));
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
    await run(() => updateSplitExerciseTargets(item.id, { targetSets: sets, targetRepsMin: min, targetRepsMax: max }));
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
  const [view, setView] = useState<"week" | "base">(mode === "personal" ? "week" : "base");
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [weekDays, setWeekDays] = useState<WeeklyScheduleDayWithDetails[]>([]);
  const [library, setLibrary] = useState<Exercise[]>([]);
  const [selectedBaseId, setSelectedBaseId] = useState<string | null>(null);
  const [selectedWeekDate, setSelectedWeekDate] = useState<ISODateOnlyString | null>(null);
  const [selectedExercise, setSelectedExercise] = useState("");
  const [showCustomExercise, setShowCustomExercise] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canEdit = mode === "personal" || role === "owner" || role === "admin";
  const anchorDate = getTodayISODate();

  const fetchDays = useCallback(
    () => mode === "group" ? fetchGroupSplit(groupId) : fetchPersonalSplit(userId),
    [groupId, mode, userId],
  );

  const loadAll = useCallback(async () => {
    const [nextDays, nextWeek] = await Promise.all([
      fetchDays(),
      mode === "personal" ? fetchEffectiveWeekSchedule(userId, anchorDate) : Promise.resolve([]),
    ]);
    setDays(nextDays);
    setWeekDays(nextWeek);
    setSelectedBaseId((current) => current && nextDays.some((day) => day.id === current) ? current : nextDays[0]?.id ?? null);
    setSelectedWeekDate((current) => current && nextWeek.some((day) => day.scheduleDate === current) ? current : nextWeek.find((day) => day.scheduleDate === anchorDate)?.scheduleDate ?? nextWeek[0]?.scheduleDate ?? null);
  }, [anchorDate, fetchDays, mode, userId]);

  useEffect(() => {
    let active = true;
    void Promise.all([fetchDays(), fetchExerciseLibrary(), mode === "personal" ? fetchEffectiveWeekSchedule(userId, anchorDate) : Promise.resolve([])])
      .then(([nextDays, nextLibrary, nextWeek]) => {
        if (!active) return;
        setDays(nextDays);
        setLibrary(nextLibrary);
        setWeekDays(nextWeek);
        const preferred = requestedWeekday && WEEKDAYS_STARTING_SATURDAY.includes(requestedWeekday)
          ? requestedWeekday
          : getWeekdayFromDate(new Date());
        setSelectedBaseId(nextDays.find((day) => day.weekday === preferred)?.id ?? nextDays[0]?.id ?? null);
        setSelectedWeekDate(nextWeek.find((day) => getWeekdayFromDate(parseISODateOnly(day.scheduleDate)) === preferred)?.scheduleDate ?? nextWeek[0]?.scheduleDate ?? null);
      })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load the split."); })
      .finally(() => { if (active) setIsLoading(false); });
    return () => { active = false; };
  }, [anchorDate, fetchDays, mode, requestedWeekday, userId]);

  const orderedDays = useMemo(() => [...days].sort((a, b) => WEEKDAYS_STARTING_SATURDAY.indexOf(a.weekday) - WEEKDAYS_STARTING_SATURDAY.indexOf(b.weekday)), [days]);
  const orderedWeek = useMemo(() => [...weekDays].sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate)), [weekDays]);
  const selectedBase = orderedDays.find((day) => day.id === selectedBaseId) ?? orderedDays[0] ?? null;
  const selectedWeek = orderedWeek.find((day) => day.scheduleDate === selectedWeekDate) ?? orderedWeek[0] ?? null;

  const [formName, setFormName] = useState("");
  const [formFocus, setFormFocus] = useState("");
  const [formType, setFormType] = useState<WorkoutType>("custom");
  const [formIcon, setFormIcon] = useState<SplitDayIconKey>("dumbbell");
  const [formColor, setFormColor] = useState<SplitDayColorKey>("indigo");
  const [formNotes, setFormNotes] = useState("");
  const [weekSourceId, setWeekSourceId] = useState("");

  useEffect(() => {
    const current = view === "base" ? selectedBase : selectedWeek;
    if (!current) return;
    setFormName(current.displayName ?? "Training day");
    setFormFocus(current.focusLabel ?? (current.workoutType === "rest" ? "Recovery" : "Custom"));
    setFormType(current.workoutType);
    setFormIcon(current.iconKey);
    setFormColor(current.colorKey);
    setFormNotes(current.dayNotes);
    if (view === "week" && selectedWeek) setWeekSourceId(selectedWeek.sourceSplitDayId ?? orderedDays.find((day) => day.workoutType !== "rest")?.id ?? "");
  }, [orderedDays, selectedBase, selectedWeek, view]);

  const availableExercises = useMemo(() => {
    if (!selectedBase) return [];
    return library.filter((exercise) => {
      const typeMatches = selectedBase.workoutType === "custom" || selectedBase.workoutType === "rest" || exercise.workoutType === selectedBase.workoutType || exercise.workoutType === "custom";
      return typeMatches && !selectedBase.exercises.some((item) => item.exerciseId === exercise.id);
    });
  }, [library, selectedBase]);

  function selectBase(day: SplitDayWithDetails) {
    setSelectedBaseId(day.id);
    setSelectedExercise("");
    setShowCustomExercise(false);
    setMessage(null);
  }

  function chooseWeekSource(sourceId: string) {
    setWeekSourceId(sourceId);
    const source = orderedDays.find((day) => day.id === sourceId);
    if (!source) return;
    setFormType(source.workoutType === "rest" ? "custom" : source.workoutType);
    setFormName(titleFor(source));
    setFormFocus(source.focusLabel ?? "Custom");
    setFormIcon(source.iconKey);
    setFormColor(source.colorKey);
    setFormNotes(source.dayNotes);
  }

  function setAsTrainingDay() {
    if (view === "week") {
      const currentSource = orderedDays.find((day) => day.id === weekSourceId && day.workoutType !== "rest");
      const source = currentSource ?? orderedDays.find((day) => day.workoutType !== "rest");
      if (source) {
        chooseWeekSource(source.id);
        return;
      }
    }

    setFormType("custom");
    if (formIcon === "moon") setFormIcon("dumbbell");
    if (formName.toLowerCase().includes("recovery") || formName.toLowerCase().includes("rest")) setFormName("Training day");
    if (formFocus.toLowerCase().includes("recovery")) setFormFocus("Custom");
  }

  async function saveIdentity() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      if (view === "base") {
        if (!selectedBase) return;
        await updateSplitDaySettings({
          splitDayId: selectedBase.id,
          workoutType: formType,
          displayName: formName,
          focusLabel: formFocus,
          iconKey: formIcon,
          colorKey: formColor,
          dayNotes: formNotes,
        });
        setMessage(`${LONG_DAY[selectedBase.weekday]} saved for every week.`);
      } else {
        if (!selectedWeek || !weekSourceId) throw new Error("Choose which workout this day should use.");
        if (formType !== "rest" && (!selectedWeekSource || selectedWeekSource.workoutType === "rest")) {
          throw new Error("Choose a training day from your repeating plan.");
        }
        await updateWeeklyScheduleDay({
          scheduleDate: selectedWeek.scheduleDate,
          sourceSplitDayId: weekSourceId,
          workoutType: formType,
          displayName: formName,
          focusLabel: formFocus,
          iconKey: formIcon,
          colorKey: formColor,
          dayNotes: formNotes,
        });
        setMessage(`${dateCaption(selectedWeek.scheduleDate)} changed for this week only.`);
      }
      await loadAll();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save this day.");
    } finally {
      setBusy(false);
    }
  }

  async function addExercise(exerciseOverride?: Exercise) {
    if (!selectedBase) return;
    const exercise = exerciseOverride ?? library.find((item) => item.id === selectedExercise);
    if (!exercise) return;
    setBusy(true);
    setError(null);
    try {
      await addSplitExercise({ splitDayId: selectedBase.id, exercise, isPersonalAddition: mode === "personal" });
      setSelectedExercise("");
      setShowCustomExercise(false);
      await loadAll();
      setMessage(`${exercise.name} added to ${titleFor(selectedBase)}.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to add the exercise.");
    } finally {
      setBusy(false);
    }
  }

  async function resetBase() {
    if (!window.confirm("Reset your repeating plan to the crew starting split?")) return;
    setBusy(true);
    setError(null);
    try {
      await resetPersonalSplitToGroup(userId);
      await loadAll();
      setMessage("Your repeating plan was reset to the crew split.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset the split.");
    } finally {
      setBusy(false);
    }
  }

  async function resetCurrentWeek() {
    if (!window.confirm("Remove this week's changes and use your repeating plan again?")) return;
    setBusy(true);
    setError(null);
    try {
      await resetWeekSchedule(anchorDate);
      await loadAll();
      setMessage("This week now matches your repeating plan.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to reset this week.");
    } finally {
      setBusy(false);
    }
  }

  async function clearDay() {
    if (!selectedBase || !window.confirm(`Remove every exercise from ${titleFor(selectedBase)}?`)) return;
    setBusy(true);
    try {
      await clearSplitDay(selectedBase.id);
      await loadAll();
      setMessage("The day is empty. Add only the exercises you need.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to clear the day.");
    } finally {
      setBusy(false);
    }
  }

  if (isLoading) return <div className="h-72 animate-pulse rounded-[24px] border border-white/[0.06] bg-white/[0.035]" />;
  if (!selectedBase) return <p className="gc-card p-5 text-sm text-neutral-400">No split days are available yet.</p>;

  const selected = view === "base" ? selectedBase : selectedWeek;
  const SelectedIcon = ICONS[formIcon];
  const selectedWeekday = selectedWeek ? getWeekdayFromDate(parseISODateOnly(selectedWeek.scheduleDate)) : null;
  const selectedWeekSource = orderedDays.find((day) => day.id === weekSourceId) ?? null;
  const hasValidWeekSource = view !== "week" || formType === "rest" || Boolean(selectedWeekSource && selectedWeekSource.workoutType !== "rest");

  return (
    <div className="space-y-4 pb-20 pt-4">
      {mode === "personal" ? <SplitSetupChooser onChanged={loadAll} /> : null}

      {mode === "personal" ? (
        <section className="gc-card p-2">
          <div className="grid grid-cols-2 gap-1 rounded-2xl bg-black/20 p-1">
            <button type="button" onClick={() => setView("week")} className={`min-h-11 rounded-xl text-sm font-bold transition ${view === "week" ? "bg-indigo-300 text-[#11131a]" : "text-neutral-400"}`}>This week</button>
            <button type="button" onClick={() => setView("base")} className={`min-h-11 rounded-xl text-sm font-bold transition ${view === "base" ? "bg-indigo-300 text-[#11131a]" : "text-neutral-400"}`}>Repeating plan</button>
          </div>
        </section>
      ) : null}

      <section className="gc-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="gc-eyebrow">{view === "week" ? "This training week" : mode === "group" ? "Crew starting plan" : "Your repeating plan"}</p>
            <h2 className="mt-1 text-xl font-bold">{view === "week" ? "Move training and recovery around" : "Make every day completely yours"}</h2>
            <p className="mt-1 text-sm leading-5 text-neutral-500">{view === "week" ? "These changes affect this week only. Your normal plan stays untouched." : "The name is primary. Push, Pull and Legs are only optional library filters."}</p>
          </div>
          {view === "week" ? <button type="button" disabled={busy} onClick={() => void resetCurrentWeek()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/[0.08]" aria-label="Reset this week"><RotateCcw className="h-4 w-4" /></button> : mode === "personal" ? <button type="button" disabled={busy} onClick={() => void resetBase()} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/[0.08]" aria-label="Reset to crew split"><RotateCcw className="h-4 w-4" /></button> : null}
        </div>

        <div className="mt-4 grid grid-cols-7 gap-1.5" role="tablist" aria-label="Choose split day">
          {(view === "week" ? orderedWeek : orderedDays).map((day) => {
            const isWeekDay = "scheduleDate" in day;
            const weekday = isWeekDay ? getWeekdayFromDate(parseISODateOnly(day.scheduleDate)) : day.weekday;
            const active = isWeekDay ? day.scheduleDate === selectedWeek?.scheduleDate : day.id === selectedBase.id;
            const Icon = ICONS[day.iconKey];
            return (
              <button key={isWeekDay ? day.scheduleDate : day.id} type="button" role="tab" aria-selected={active} onClick={() => {
                if (isWeekDay) setSelectedWeekDate(day.scheduleDate); else selectBase(day);
                setMessage(null);
              }} className={`min-w-0 rounded-xl border px-1 py-2 text-center transition ${active ? "border-indigo-300/55 bg-indigo-300 text-[#11131a]" : "border-white/[0.07] bg-white/[0.025]"}`}>
                <span className={`block text-[9px] font-bold uppercase ${active ? "text-[#11131a]/65" : "text-neutral-500"}`}>{SHORT_DAY[weekday]}</span>
                <Icon className={`mx-auto mt-1 h-3.5 w-3.5 ${active ? "text-[#11131a]" : day.workoutType === "rest" ? "text-neutral-600" : "text-neutral-300"}`} />
                <span className={`mt-1 block truncate text-[9px] font-semibold sm:text-[10px] ${active ? "text-[#11131a]" : day.workoutType === "rest" ? "text-neutral-500" : "text-neutral-200"}`}>{day.displayName ?? "Training"}</span>
                {isWeekDay ? <span className={`mt-0.5 block text-[8px] ${active ? "text-[#11131a]/55" : "text-neutral-600"}`}>{dateCaption(day.scheduleDate)}</span> : null}
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-5 text-neutral-500"><strong className="text-neutral-300">Recovery rule:</strong> use as many rest days as your plan needs, but no more than two in a row.</p>
      </section>

      {error ? <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm font-semibold text-red-300">{error}</p> : null}
      {message ? <p className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-sm font-semibold text-emerald-300">{message}</p> : null}

      {selected ? (
        <section className="gc-card overflow-visible">
          <div className="p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="gc-eyebrow">{view === "week" && selectedWeekday ? `${LONG_DAY[selectedWeekday]} · ${dateCaption(selectedWeek!.scheduleDate)}` : LONG_DAY[selectedBase.weekday]}</p>
                <h2 className="mt-1 text-2xl font-bold">{formName || "Training day"}</h2>
                <p className="mt-1 text-sm text-neutral-500">{formType === "rest" ? "Planned recovery keeps your daily consistency streak alive." : `${view === "week" ? selectedWeek?.exercises.length ?? 0 : selectedBase.exercises.length} exercises · ${formFocus || "Custom focus"}`}</p>
              </div>
              <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl border ${COLOR_TONES[formColor]}`}><SelectedIcon className="h-5 w-5" /></span>
            </div>

            {canEdit ? (
              <div className="mt-5 space-y-4">
                {view === "week" ? (
                  <fieldset>
                    <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Use workout from your plan</legend>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {orderedDays.filter((day) => day.workoutType !== "rest").map((day) => {
                        const active = weekSourceId === day.id && formType !== "rest";
                        const Icon = ICONS[day.iconKey];
                        return <button key={day.id} type="button" onClick={() => chooseWeekSource(day.id)} className={`flex min-h-12 items-center gap-3 rounded-xl border px-3 text-left ${active ? "border-indigo-300/45 bg-indigo-300/[0.1]" : "border-white/[0.08] bg-white/[0.025]"}`}><Icon className="h-4 w-4 text-indigo-200" /><span className="min-w-0"><strong className="block truncate text-sm">{titleFor(day)}</strong><span className="block truncate text-[11px] text-neutral-500">{day.focusLabel ?? "Custom"}</span></span>{active ? <Check className="ml-auto h-4 w-4 text-indigo-200" /> : null}</button>;
                      })}
                    </div>
                  </fieldset>
                ) : null}

                <fieldset>
                  <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Plan for this day</legend>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <button type="button" onClick={setAsTrainingDay} className={`min-h-11 rounded-xl border text-sm font-bold ${formType !== "rest" ? "border-indigo-300/50 bg-indigo-300 text-[#11131a]" : "border-white/[0.08] text-neutral-400"}`}>Training</button>
                    <button type="button" onClick={() => { setFormType("rest"); setFormName("Recovery"); setFormFocus("Recovery"); setFormIcon("moon"); setFormColor("blue"); }} className={`min-h-11 rounded-xl border text-sm font-bold ${formType === "rest" ? "border-indigo-300/50 bg-indigo-300 text-[#11131a]" : "border-white/[0.08] text-neutral-400"}`}>Recovery</button>
                  </div>
                </fieldset>

                {view === "base" && formType !== "rest" ? (
                  <fieldset>
                    <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Exercise library filter</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {WORKOUT_FILTERS.map((filter) => <button key={filter.value} type="button" onClick={() => setFormType(filter.value)} className={`rounded-full border px-3 py-2 text-xs font-bold ${formType === filter.value ? "border-indigo-300/45 bg-indigo-300/[0.12] text-indigo-100" : "border-white/[0.08] text-neutral-500"}`}>{filter.label}</button>)}
                    </div>
                    <p className="mt-2 text-xs text-neutral-600">This helps search the exercise library. It never replaces your custom day name.</p>
                  </fieldset>
                ) : null}

                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-neutral-500">Day name<input value={formName} onChange={(event) => setFormName(event.target.value)} maxLength={40} placeholder="e.g. Upper A" className="gc-input mt-1 normal-case" /></label>
                  <label className="text-xs font-bold uppercase tracking-wide text-neutral-500">Focus label<input value={formFocus} onChange={(event) => setFormFocus(event.target.value)} maxLength={32} placeholder="e.g. Chest & back" className="gc-input mt-1 normal-case" /></label>
                </div>

                <fieldset>
                  <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Icon</legend>
                  <div className="mt-2 flex flex-wrap gap-2">{ICON_OPTIONS.map(({ key, label }) => { const Icon = ICONS[key]; return <button key={key} type="button" title={label} aria-label={label} onClick={() => setFormIcon(key)} className={`grid h-11 w-11 place-items-center rounded-xl border ${formIcon === key ? "border-indigo-300/50 bg-indigo-300 text-[#11131a]" : "border-white/[0.08] bg-white/[0.025] text-neutral-400"}`}><Icon className="h-4 w-4" /></button>; })}</div>
                </fieldset>

                <fieldset>
                  <legend className="text-[10px] font-bold uppercase tracking-[0.09em] text-neutral-500">Color</legend>
                  <div className="mt-2 flex gap-2">{COLOR_OPTIONS.map(({ key, className }) => <button key={key} type="button" aria-label={`${key} color`} onClick={() => setFormColor(key)} className={`relative grid h-10 w-10 place-items-center rounded-full border ${formColor === key ? "border-white/70" : "border-white/[0.08]"}`}><span className={`h-5 w-5 rounded-full ${className}`} />{formColor === key ? <Check className="absolute h-3 w-3 text-[#11131a]" /> : null}</button>)}</div>
                </fieldset>

                <label className="block text-xs font-bold uppercase tracking-wide text-neutral-500">Notes for this day<textarea value={formNotes} onChange={(event) => setFormNotes(event.target.value)} maxLength={240} rows={3} placeholder="Grip, tempo, effort target…" className="gc-input mt-1 resize-none text-sm normal-case" /></label>
                <button type="button" disabled={busy || formName.trim().length < 2 || formFocus.trim().length < 2 || (view === "week" && (!weekSourceId || !hasValidWeekSource))} onClick={() => void saveIdentity()} className="gc-primary-button w-full min-h-12 disabled:opacity-40"><Save className="h-4 w-4" /> Save {view === "week" ? "this week" : "repeating day"}</button>
              </div>
            ) : null}
          </div>

          {view === "week" ? (
            <div className="border-t border-white/[0.06] p-4 sm:p-5">
              <p className="text-sm leading-6 text-neutral-500">Exercises come from <strong className="text-neutral-300">{selectedWeek?.sourceDay ? titleFor(selectedWeek.sourceDay) : "your repeating plan"}</strong>. To change its exercise list, open the Repeating plan tab.</p>
              <button type="button" onClick={() => { setView("base"); if (selectedWeek?.sourceSplitDayId) setSelectedBaseId(selectedWeek.sourceSplitDayId); }} className="gc-secondary-button mt-3">Edit its exercises</button>
            </div>
          ) : selectedBase.workoutType === "rest" ? (
            <div className="border-t border-white/[0.06] p-4 sm:p-5"><div className="rounded-2xl border border-dashed border-white/[0.1] p-5 text-center"><Moon className="mx-auto h-5 w-5 text-sky-200" /><p className="mt-2 font-bold">Recovery day</p><p className="mt-1 text-sm text-neutral-500">Saved exercises are kept and return if this day becomes training again.</p></div></div>
          ) : (
            <div className="border-t border-white/[0.06] p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-bold">Exercises</h3><p className="text-xs text-neutral-500">Tap an exercise to edit its target sets and reps.</p></div><span className="gc-chip">{selectedBase.exercises.length}</span></div>
              <ul className="space-y-2">{selectedBase.exercises.map((item, index) => <ExerciseEditor key={`${item.id}:${item.targetSets}:${item.targetRepsMin}:${item.targetRepsMax}`} item={item} index={index} count={selectedBase.exercises.length} canEdit={canEdit} onReload={loadAll} onError={setError} />)}</ul>
              {selectedBase.exercises.length === 0 ? <p className="rounded-2xl border border-dashed border-white/[0.1] p-5 text-center text-sm text-neutral-500">This day is empty. Add the movements you actually use in the gym.</p> : null}
              {canEdit ? (
                <div className="mt-4 space-y-3">
                  <div className="flex gap-2"><select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)} className="gc-input min-w-0 flex-1 text-sm"><option value="">Choose an exercise…</option>{availableExercises.map((exercise) => <option key={exercise.id} value={exercise.id}>{exercise.name}</option>)}</select><button type="button" disabled={!selectedExercise || busy} onClick={() => void addExercise()} className="gc-primary-button min-h-12 px-4 disabled:opacity-40"><Plus className="h-4 w-4" /> Add</button></div>
                  <div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => setShowCustomExercise((value) => !value)} className="gc-secondary-button"><Plus className="h-4 w-4" /> Custom exercise</button><button type="button" disabled={selectedBase.exercises.length === 0 || busy} onClick={() => void clearDay()} className="gc-secondary-button text-red-300 disabled:opacity-40"><Trash2 className="h-4 w-4" /> Clear day</button></div>
                  {showCustomExercise ? <CustomExerciseForm defaultWorkoutType={selectedBase.workoutType} onCreated={addExercise} onCancel={() => setShowCustomExercise(false)} /> : null}
                </div>
              ) : null}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
