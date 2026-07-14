import { calculateWeeklyAdherence } from "@/lib/calculations/adherence";
import { calculateWorkoutVolume } from "@/lib/calculations/volume";
import {
  getScheduledDatesInRange,
  getTrainingWeekStart,
  getTodayISODate,
  parseISODateOnly,
} from "@/lib/dates";
import { fetchPersonalRecords } from "@/features/personal-records/services/personal-record.service";
import { fetchProfile } from "@/features/profile/services/profile.service";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import { fetchWorkoutStreak } from "@/features/streaks/services/streak.service";
import { fetchWorkoutHistory } from "@/features/workouts/services/workout-session.service";
import type { MuscleGroup, UUID, Weekday, WorkoutSet } from "@/types";
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

async function getSchedule(userId: UUID): Promise<Weekday[]> {
  const [profile, split] = await Promise.all([fetchProfile(userId), fetchPersonalSplit(userId)]);
  const personalRestDays = new Set(profile?.additionalRestDays ?? []);
  return split
    .filter((day) => day.workoutType !== "rest" && !personalRestDays.has(day.weekday))
    .map((day) => day.weekday);
}

function countCompletedScheduledDates(
  completedDates: Set<string>,
  scheduledDates: string[],
): number {
  return scheduledDates.filter((date) => completedDates.has(date)).length;
}

export async function fetchAdherenceSummary(userId: UUID): Promise<AdherenceSummary> {
  const [scheduledWeekdays, history] = await Promise.all([
    getSchedule(userId),
    fetchWorkoutHistory(userId),
  ]);
  const today = parseISODateOnly(getTodayISODate());
  const weekStart = getTrainingWeekStart(today);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1, 12, 0, 0, 0);
  const completedDates = new Set(history.map((session) => session.scheduledDate));
  const weeklyDates = getScheduledDatesInRange(weekStart, today, scheduledWeekdays);
  const monthlyDates = getScheduledDatesInRange(monthStart, today, scheduledWeekdays);
  const weeklyCompleted = countCompletedScheduledDates(completedDates, weeklyDates);
  const monthlyCompleted = countCompletedScheduledDates(completedDates, monthlyDates);

  return {
    weekly: calculateWeeklyAdherence(weeklyDates.length, weeklyCompleted),
    monthly: calculateWeeklyAdherence(monthlyDates.length, monthlyCompleted),
    weeklyCompleted,
    weeklyScheduled: weeklyDates.length,
    monthlyCompleted,
    monthlyScheduled: monthlyDates.length,
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
