import { calculateWeeklyAdherence } from "@/lib/calculations/adherence";
import { createClient } from "@/lib/supabase/client";
import { calculateWorkoutVolume } from "@/lib/calculations/volume";
import {
  enumerateDateRange,
  getTrainingWeekStart,
  getTodayISODate,
  getWeekdayFromDate,
  parseISODateOnly,
  toISODateOnly,
} from "@/lib/dates";
import { fetchPersonalRecords } from "@/features/personal-records/services/personal-record.service";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import { fetchWorkoutStreak } from "@/features/streaks/services/streak.service";
import { fetchWorkoutHistory } from "@/features/workouts/services/workout-session.service";
import type { MuscleGroup, UUID, WorkoutSet, WorkoutType } from "@/types";
import type { PersonalRecordWithExerciseName } from "@/features/personal-records/types";

export interface AdherenceSummary {
  weekly: number | null;
  monthly: number | null;
  weeklyCompleted: number;
  weeklyScheduled: number;
  monthlyCompleted: number;
  monthlyScheduled: number;
}

export interface ExerciseProgressPoint {
  sessionId: UUID;
  date: string;
  maxWeightKg: number;
  volume: number;
  estimatedOneRepMaxKg: number;
  bestReps: number;
}

export interface ExerciseProgressSummary {
  exerciseId: UUID;
  exerciseName: string;
  primaryMuscle: MuscleGroup;
  sessionCount: number;
  lastTrainedAt: string;
  maxWeightKg: number;
  bestSetVolumeKg: number;
  totalVolumeKg: number;
  estimatedOneRepMaxKg: number;
}

export interface MuscleTrainingSummary {
  muscle: MuscleGroup;
  completedSets: number;
  volumeKg: number;
  exerciseCount: number;
}

export interface PersonalProgressSummary {
  adherence: AdherenceSummary;
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalVolumeKg: number;
  volumeThisMonthKg: number;
  totalDurationSeconds: number;
  averageDurationSeconds: number;
  recentRecords: PersonalRecordWithExerciseName[];
  muscles: MuscleTrainingSummary[];
}

function getEstimatedOneRepMax(set: WorkoutSet): number {
  if (!set.isCompleted || set.weightKg === null || set.reps === null || set.reps <= 0) return 0;
  return set.weightKg * (1 + set.reps / 30);
}

function countCompletedScheduledDates(
  completedDates: Set<string>,
  scheduledDates: string[],
): number {
  return scheduledDates.filter((date) => completedDates.has(date)).length;
}

export async function fetchAdherenceSummary(userId: UUID): Promise<AdherenceSummary> {
  const todayISO = getTodayISODate();
  const today = parseISODateOnly(todayISO);
  const weekStart = getTrainingWeekStart(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
  const supabase = createClient();

  const [split, history] = await Promise.all([
    fetchPersonalSplit(userId),
    fetchWorkoutHistory(userId),
    supabase.rpc("ensure_week_schedule", { target_anchor_date: todayISO }).then(({ error }) => {
      if (error) throw new Error(error.message);
    }),
  ]).then(([nextSplit, nextHistory]) => [nextSplit, nextHistory] as const);

  const { data: overrides, error: overrideError } = await supabase
    .from("weekly_schedule_days")
    .select("schedule_date, workout_type")
    .eq("user_id", userId)
    .gte("schedule_date", toISODateOnly(monthStart))
    .lte("schedule_date", todayISO);
  if (overrideError) throw new Error(overrideError.message);

  const baseTypes = new Map(split.map((day) => [day.weekday, day.workoutType]));
  const overrideTypes = new Map(overrides.map((day) => [day.schedule_date, day.workout_type as WorkoutType]));
  const scheduledDates = enumerateDateRange(monthStart, today)
    .filter((date) => {
      const isoDate = toISODateOnly(date);
      const type = overrideTypes.get(isoDate) ?? baseTypes.get(getWeekdayFromDate(date)) ?? "rest";
      return type !== "rest";
    })
    .map(toISODateOnly);

  const weeklyDates = scheduledDates.filter((date) => date >= toISODateOnly(weekStart));
  const completedDates = new Set(history.map((session) => session.scheduledDate));
  const weeklyCompleted = countCompletedScheduledDates(completedDates, weeklyDates);
  const monthlyCompleted = countCompletedScheduledDates(completedDates, scheduledDates);

  return {
    weekly: calculateWeeklyAdherence(weeklyDates.length, weeklyCompleted),
    monthly: calculateWeeklyAdherence(scheduledDates.length, monthlyCompleted),
    weeklyCompleted,
    weeklyScheduled: weeklyDates.length,
    monthlyCompleted,
    monthlyScheduled: scheduledDates.length,
  };
}

export async function fetchExerciseProgressHistory(
  userId: UUID,
  exerciseId: UUID,
): Promise<ExerciseProgressPoint[]> {
  const history = await fetchWorkoutHistory(userId);
  return history
    .flatMap((session) => {
      const workoutExercise = session.exercises.find((item) => item.exerciseId === exerciseId);
      if (!workoutExercise) return [];
      const completedSets = workoutExercise.sets.filter((set) => set.isCompleted && !set.isWarmup);
      const maxWeightKg = Math.max(0, ...completedSets.map((set) => set.weightKg ?? 0));
      const bestReps = Math.max(0, ...completedSets.map((set) => set.reps ?? 0));
      const estimatedOneRepMaxKg = Math.max(0, ...completedSets.map(getEstimatedOneRepMax));
      return [{
        sessionId: session.id,
        date: session.completedAt ?? session.scheduledDate,
        maxWeightKg,
        bestReps,
        estimatedOneRepMaxKg,
        volume: calculateWorkoutVolume(completedSets),
      }];
    })
    .sort((a, b) => a.date.localeCompare(b.date));
}

export async function fetchExerciseProgressSummaries(
  userId: UUID,
): Promise<ExerciseProgressSummary[]> {
  const history = await fetchWorkoutHistory(userId);
  const summaries = new Map<UUID, ExerciseProgressSummary>();

  for (const session of history) {
    for (const workoutExercise of session.exercises) {
      const completedSets = workoutExercise.sets.filter((set) => set.isCompleted && !set.isWarmup);
      if (completedSets.length === 0) continue;
      const sessionVolume = calculateWorkoutVolume(completedSets);
      const maxWeight = Math.max(0, ...completedSets.map((set) => set.weightKg ?? 0));
      const bestSetVolume = Math.max(
        0,
        ...completedSets.map((set) => (set.weightKg ?? 0) * (set.reps ?? 0)),
      );
      const estimatedOneRepMax = Math.max(0, ...completedSets.map(getEstimatedOneRepMax));
      const previous = summaries.get(workoutExercise.exerciseId);
      const trainedAt = session.completedAt ?? session.scheduledDate;

      summaries.set(workoutExercise.exerciseId, {
        exerciseId: workoutExercise.exerciseId,
        exerciseName: workoutExercise.exercise.name,
        primaryMuscle: workoutExercise.exercise.primaryMuscle,
        sessionCount: (previous?.sessionCount ?? 0) + 1,
        lastTrainedAt: previous && previous.lastTrainedAt > trainedAt ? previous.lastTrainedAt : trainedAt,
        maxWeightKg: Math.max(previous?.maxWeightKg ?? 0, maxWeight),
        bestSetVolumeKg: Math.max(previous?.bestSetVolumeKg ?? 0, bestSetVolume),
        totalVolumeKg: (previous?.totalVolumeKg ?? 0) + sessionVolume,
        estimatedOneRepMaxKg: Math.max(previous?.estimatedOneRepMaxKg ?? 0, estimatedOneRepMax),
      });
    }
  }

  return [...summaries.values()].sort((a, b) => b.lastTrainedAt.localeCompare(a.lastTrainedAt));
}

function buildMuscleSummary(
  history: Awaited<ReturnType<typeof fetchWorkoutHistory>>,
): MuscleTrainingSummary[] {
  const summaries = new Map<MuscleGroup, MuscleTrainingSummary>();
  const exerciseIdsByMuscle = new Map<MuscleGroup, Set<UUID>>();

  for (const session of history) {
    for (const workoutExercise of session.exercises) {
      const muscle = workoutExercise.exercise.primaryMuscle;
      const completedSets = workoutExercise.sets.filter((set) => set.isCompleted && !set.isWarmup);
      if (completedSets.length === 0) continue;
      const previous = summaries.get(muscle) ?? {
        muscle,
        completedSets: 0,
        volumeKg: 0,
        exerciseCount: 0,
      };
      const ids = exerciseIdsByMuscle.get(muscle) ?? new Set<UUID>();
      ids.add(workoutExercise.exerciseId);
      exerciseIdsByMuscle.set(muscle, ids);
      summaries.set(muscle, {
        ...previous,
        completedSets: previous.completedSets + completedSets.length,
        volumeKg: previous.volumeKg + calculateWorkoutVolume(completedSets),
        exerciseCount: ids.size,
      });
    }
  }

  return [...summaries.values()].sort((a, b) => b.completedSets - a.completedSets);
}

export async function fetchPersonalProgressSummary(userId: UUID): Promise<PersonalProgressSummary> {
  const [history, adherence, streak, records] = await Promise.all([
    fetchWorkoutHistory(userId),
    fetchAdherenceSummary(userId),
    fetchWorkoutStreak(userId),
    fetchPersonalRecords(userId),
  ]);
  const today = parseISODateOnly(getTodayISODate());
  const weekStart = getTrainingWeekStart(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
  const weekStartISO = getTodayISODateFor(weekStart);
  const monthStartISO = getTodayISODateFor(monthStart);
  let totalVolumeKg = 0;
  let volumeThisMonthKg = 0;
  let totalDurationSeconds = 0;

  for (const session of history) {
    const sessionVolume = session.exercises.reduce(
      (total, exercise) => total + calculateWorkoutVolume(exercise.sets),
      0,
    );
    totalVolumeKg += sessionVolume;
    if (session.scheduledDate >= monthStartISO) volumeThisMonthKg += sessionVolume;
    totalDurationSeconds += session.durationSeconds;
  }

  return {
    adherence,
    currentStreak: streak.currentStreak,
    longestStreak: streak.longestStreak,
    totalSessions: history.length,
    sessionsThisWeek: history.filter((session) => session.scheduledDate >= weekStartISO).length,
    sessionsThisMonth: history.filter((session) => session.scheduledDate >= monthStartISO).length,
    totalVolumeKg,
    volumeThisMonthKg,
    totalDurationSeconds,
    averageDurationSeconds: history.length === 0 ? 0 : Math.round(totalDurationSeconds / history.length),
    recentRecords: records.slice(0, 6),
    muscles: buildMuscleSummary(history),
  };
}

function getTodayISODateFor(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export interface BestRepsAtWeight {
  weightKg: number;
  reps: number;
  achievedAt: string;
  workoutSetId: UUID;
}

export interface ExerciseSessionPerformance extends ExerciseProgressPoint {
  sets: Array<{
    id: UUID;
    setNumber: number;
    weightKg: number | null;
    reps: number | null;
    isPersonalRecord: boolean;
  }>;
}

export interface ExerciseProgressDetails {
  summary: ExerciseProgressSummary | null;
  sessions: ExerciseSessionPerformance[];
  bestRepsByWeight: BestRepsAtWeight[];
}

export async function fetchExerciseProgressDetails(
  userId: UUID,
  exerciseId: UUID,
): Promise<ExerciseProgressDetails> {
  const [history, summaries] = await Promise.all([
    fetchWorkoutHistory(userId),
    fetchExerciseProgressSummaries(userId),
  ]);
  const bestByWeight = new Map<number, BestRepsAtWeight>();
  const sessions: ExerciseSessionPerformance[] = [];

  for (const session of history) {
    const workoutExercise = session.exercises.find((item) => item.exerciseId === exerciseId);
    if (!workoutExercise) continue;
    const completedSets = workoutExercise.sets.filter((set) => set.isCompleted && !set.isWarmup);
    if (completedSets.length === 0) continue;

    for (const set of completedSets) {
      if (set.weightKg === null || set.reps === null) continue;
      const previous = bestByWeight.get(set.weightKg);
      const achievedAt = session.completedAt ?? set.updatedAt;
      if (!previous || set.reps > previous.reps) {
        bestByWeight.set(set.weightKg, {
          weightKg: set.weightKg,
          reps: set.reps,
          achievedAt,
          workoutSetId: set.id,
        });
      }
    }

    sessions.push({
      sessionId: session.id,
      date: session.completedAt ?? session.scheduledDate,
      maxWeightKg: Math.max(0, ...completedSets.map((set) => set.weightKg ?? 0)),
      bestReps: Math.max(0, ...completedSets.map((set) => set.reps ?? 0)),
      estimatedOneRepMaxKg: Math.max(0, ...completedSets.map(getEstimatedOneRepMax)),
      volume: calculateWorkoutVolume(completedSets),
      sets: completedSets.map((set) => ({
        id: set.id,
        setNumber: set.setNumber,
        weightKg: set.weightKg,
        reps: set.reps,
        isPersonalRecord: set.isPersonalRecord,
      })),
    });
  }

  return {
    summary: summaries.find((item) => item.exerciseId === exerciseId) ?? null,
    sessions: sessions.sort((a, b) => a.date.localeCompare(b.date)),
    bestRepsByWeight: [...bestByWeight.values()].sort((a, b) => b.weightKg - a.weightKg),
  };
}

export type AnalyticsRangeDays = 7 | 30 | 90;
export type MuscleMetric = "sets" | "volume";

export interface MuscleAnalyticsSummary extends MuscleTrainingSummary {
  weightedSets: number;
  weightedVolumeKg: number;
  intensityBySets: number;
  intensityByVolume: number;
}

export interface TrainingTrendPoint {
  weekStart: string;
  label: string;
  sessions: number;
  workingSets: number;
  volumeKg: number;
  averageDurationSeconds: number;
}

const ALL_MUSCLES: MuscleGroup[] = [
  "chest",
  "back",
  "shoulders",
  "biceps",
  "triceps",
  "quads",
  "hamstrings",
  "glutes",
  "calves",
  "core",
];

function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function subtractDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() - days);
  copy.setHours(12, 0, 0, 0);
  return copy;
}

export async function fetchMuscleAnalytics(
  userId: UUID,
  rangeDays: AnalyticsRangeDays = 30,
): Promise<MuscleAnalyticsSummary[]> {
  const history = await fetchWorkoutHistory(userId);
  const cutoff = toDateOnly(subtractDays(new Date(), rangeDays - 1));
  const map = new Map<MuscleGroup, Omit<MuscleAnalyticsSummary, "intensityBySets" | "intensityByVolume">>();
  const exerciseIds = new Map<MuscleGroup, Set<UUID>>();

  for (const muscle of ALL_MUSCLES) {
    map.set(muscle, {
      muscle,
      completedSets: 0,
      volumeKg: 0,
      exerciseCount: 0,
      weightedSets: 0,
      weightedVolumeKg: 0,
    });
    exerciseIds.set(muscle, new Set());
  }

  for (const session of history) {
    if (session.scheduledDate < cutoff) continue;
    for (const workoutExercise of session.exercises) {
      const completedSets = workoutExercise.sets.filter((set) => set.isCompleted && !set.isWarmup);
      if (completedSets.length === 0) continue;
      const volume = calculateWorkoutVolume(completedSets);
      const primary = workoutExercise.exercise.primaryMuscle;
      const primarySummary = map.get(primary)!;
      primarySummary.completedSets += completedSets.length;
      primarySummary.volumeKg += volume;
      primarySummary.weightedSets += completedSets.length;
      primarySummary.weightedVolumeKg += volume;
      exerciseIds.get(primary)!.add(workoutExercise.exerciseId);

      for (const secondary of workoutExercise.exercise.secondaryMuscles) {
        const secondarySummary = map.get(secondary)!;
        secondarySummary.weightedSets += completedSets.length * 0.35;
        secondarySummary.weightedVolumeKg += volume * 0.35;
        exerciseIds.get(secondary)!.add(workoutExercise.exerciseId);
      }
    }
  }

  const maxSets = Math.max(1, ...[...map.values()].map((item) => item.weightedSets));
  const maxVolume = Math.max(1, ...[...map.values()].map((item) => item.weightedVolumeKg));

  return ALL_MUSCLES.map((muscle) => {
    const item = map.get(muscle)!;
    return {
      ...item,
      exerciseCount: exerciseIds.get(muscle)!.size,
      intensityBySets: item.weightedSets / maxSets,
      intensityByVolume: item.weightedVolumeKg / maxVolume,
    };
  }).sort((a, b) => b.weightedSets - a.weightedSets);
}

export async function fetchTrainingTrend(
  userId: UUID,
  weekCount = 8,
): Promise<TrainingTrendPoint[]> {
  const history = await fetchWorkoutHistory(userId);
  const currentWeekStart = getTrainingWeekStart(new Date());
  const points: TrainingTrendPoint[] = [];

  for (let index = weekCount - 1; index >= 0; index -= 1) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(weekStart.getDate() - index * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const startISO = toDateOnly(weekStart);
    const endISO = toDateOnly(weekEnd);
    const sessions = history.filter(
      (session) => session.scheduledDate >= startISO && session.scheduledDate <= endISO,
    );
    const workingSets = sessions.reduce(
      (total, session) => total + session.exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + exercise.sets.filter(
          (set) => set.isCompleted && !set.isWarmup,
        ).length,
        0,
      ),
      0,
    );
    const volumeKg = sessions.reduce(
      (total, session) => total + session.exercises.reduce(
        (exerciseTotal, exercise) => exerciseTotal + calculateWorkoutVolume(exercise.sets),
        0,
      ),
      0,
    );
    const duration = sessions.reduce((total, session) => total + session.durationSeconds, 0);

    points.push({
      weekStart: startISO,
      label: weekStart.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      sessions: sessions.length,
      workingSets,
      volumeKg,
      averageDurationSeconds: sessions.length === 0 ? 0 : Math.round(duration / sessions.length),
    });
  }

  return points;
}
