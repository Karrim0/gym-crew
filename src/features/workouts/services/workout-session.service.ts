import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import {
  cacheExercises,
  enqueueOfflineMutation,
  getLocalActiveWorkout,
  getLocalWorkoutHistory,
  getLocalWorkoutSession,
  getOfflineDatabase,
  requestSync,
  removeLocalWorkoutSession,
  saveWorkoutLocally,
  workoutExerciseMutation,
  workoutSessionMutation,
  workoutSetMutation,
} from "@/lib/offline";
import { generateClientId } from "@/lib/utils/id";
import type { UUID, WorkoutExercise, WorkoutSession, WorkoutSet } from "@/types";
import { fetchExerciseById, mapExercise } from "@/features/exercises/services/exercise.service";
import type { SplitDayWithDetails } from "@/features/splits/types";
import type { WorkoutSessionWithDetails } from "../types";

type SessionRow = Tables<"workout_sessions">;
type WorkoutExerciseRow = Tables<"workout_exercises">;
type WorkoutSetRow = Tables<"workout_sets">;
type ExerciseRow = Tables<"exercises">;

type WorkoutExerciseQueryRow = WorkoutExerciseRow & {
  exercises: ExerciseRow;
  workout_sets: WorkoutSetRow[];
};

type WorkoutSessionQueryRow = SessionRow & {
  workout_exercises: WorkoutExerciseQueryRow[];
};

function mapSet(row: WorkoutSetRow, recordSetIds = new Set<string>()): WorkoutSet {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    reps: row.reps,
    isWarmup: row.is_warmup,
    isCompleted: row.is_completed,
    isPersonalRecord: recordSetIds.has(row.id),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutExercise(row: WorkoutExerciseQueryRow, recordSetIds = new Set<string>()) {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    order: row.position,
    isSessionOnlyAddition: row.is_session_only_addition,
    notes: row.notes,
    exercise: mapExercise(row.exercises),
    sets: [...row.workout_sets]
      .sort((a, b) => a.set_number - b.set_number)
      .map((set) => mapSet(set, recordSetIds)),
  };
}

function mapSession(
  row: WorkoutSessionQueryRow,
  recordSetIds = new Set<string>(),
): WorkoutSessionWithDetails {
  return {
    id: row.id,
    clientId: row.client_id,
    userId: row.user_id,
    groupId: row.group_id,
    splitDayId: row.split_day_id,
    scheduledDate: row.scheduled_date,
    status: row.status,
    notes: row.notes,
    durationSeconds: row.duration_seconds,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
    exercises: [...row.workout_exercises]
      .sort((a, b) => a.position - b.position)
      .map((exercise) => mapWorkoutExercise(exercise, recordSetIds)),
  };
}

const SESSION_SELECT = "*, workout_exercises(*, exercises(*), workout_sets(*))";

async function loadRecordSetIds(session: WorkoutSessionWithDetails): Promise<Set<string>> {
  const setIds = session.exercises.flatMap((exercise) => exercise.sets.map((set) => set.id));
  if (setIds.length === 0) return new Set();
  const supabase = createClient();
  const { data } = await supabase
    .from("personal_records")
    .select("workout_set_id")
    .in("workout_set_id", setIds);
  return new Set((data ?? []).map((record) => record.workout_set_id));
}

async function fetchRemoteSessionById(sessionId: UUID): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const base = mapSession(data as unknown as WorkoutSessionQueryRow);
  const recordSetIds = await loadRecordSetIds(base);
  const session = mapSession(data as unknown as WorkoutSessionQueryRow, recordSetIds);
  await cacheExercises(session.exercises.map((exercise) => exercise.exercise));
  await saveWorkoutLocally(session);
  return session;
}

export async function fetchWorkoutSessionById(
  sessionId: UUID,
): Promise<WorkoutSessionWithDetails | null> {
  const local = await getLocalWorkoutSession(sessionId);
  if (local) return local;
  return fetchRemoteSessionById(sessionId);
}

export async function fetchActiveWorkoutSession(): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  const currentUser = sessionData.session?.user;
  if (sessionError || !currentUser) throw new Error("You must be signed in.");

  const local = await getLocalActiveWorkout(currentUser.id);
  if (local) return local;

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", currentUser.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;
  const session = mapSession(data as unknown as WorkoutSessionQueryRow);
  await cacheExercises(session.exercises.map((exercise) => exercise.exercise));
  await saveWorkoutLocally(session);
  return session;
}

export async function fetchWorkoutHistory(userId: UUID): Promise<WorkoutSessionWithDetails[]> {
  const localHistory = await getLocalWorkoutHistory(userId, 100);
  const merged = new Map(localHistory.map((session) => [session.id, session]));

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("workout_sessions")
      .select(SESSION_SELECT)
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(100);

    if (error) throw new Error(error.message);
    for (const row of data as unknown as WorkoutSessionQueryRow[]) {
      const session = mapSession(row);
      const local = merged.get(session.id);
      if (!local || session.updatedAt > local.updatedAt) {
        merged.set(session.id, session);
        await saveWorkoutLocally(session);
      }
    }
  } catch {
    // Local history is the source of truth while offline.
  }

  return [...merged.values()].sort((a, b) =>
    (b.completedAt ?? b.updatedAt).localeCompare(a.completedAt ?? a.updatedAt),
  );
}

export async function startWorkoutSession(
  userId: UUID,
  splitDay: SplitDayWithDetails,
  scheduledDate = new Date().toISOString().slice(0, 10),
): Promise<WorkoutSessionWithDetails> {
  const existing = await getLocalActiveWorkout(userId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const sessionId = generateClientId();
  const session: WorkoutSessionWithDetails = {
    id: sessionId,
    clientId: generateClientId(),
    userId,
    groupId: splitDay.groupId,
    splitDayId: splitDay.id,
    scheduledDate,
    status: "in_progress",
    notes: "",
    durationSeconds: 0,
    startedAt: now,
    completedAt: null,
    updatedAt: now,
    exercises: splitDay.exercises.map((template, exerciseIndex) => {
      const workoutExerciseId = generateClientId();
      return {
        id: workoutExerciseId,
        workoutSessionId: sessionId,
        exerciseId: template.exerciseId,
        order: exerciseIndex,
        isSessionOnlyAddition: false,
        notes: "",
        exercise: template.exercise,
        sets: Array.from({ length: template.targetSets }, (_, setIndex) => ({
          id: generateClientId(),
          workoutExerciseId,
          setNumber: setIndex + 1,
          weightKg: null,
          reps: null,
          isWarmup: false,
          isCompleted: false,
          isPersonalRecord: false,
          createdAt: now,
          updatedAt: now,
        })),
      };
    }),
  };

  await saveWorkoutLocally(session);
  await enqueueOfflineMutation(workoutSessionMutation("create", session));
  for (const exercise of session.exercises) {
    await enqueueOfflineMutation(workoutExerciseMutation("create", exercise));
    for (const set of exercise.sets) {
      await enqueueOfflineMutation(workoutSetMutation("create", set));
    }
  }
  requestSync();
  return session;
}

export async function updateWorkoutSet(
  setId: UUID,
  values: { weightKg: number | null; reps: number | null; isCompleted: boolean; isWarmup?: boolean },
): Promise<WorkoutSet> {
  const db = getOfflineDatabase();
  const existing = await db.workoutSets.get(setId);
  if (!existing) throw new Error("The set is not available on this device.");
  const updated: WorkoutSet = {
    ...existing,
    weightKg: values.weightKg,
    reps: values.reps,
    isCompleted: values.isCompleted,
    ...(values.isWarmup !== undefined ? { isWarmup: values.isWarmup } : {}),
    updatedAt: new Date().toISOString(),
  };
  await db.workoutSets.put(updated);
  await enqueueOfflineMutation(workoutSetMutation("update", updated));
  requestSync();
  return updated;
}

export async function addWorkoutSet(workoutExerciseId: UUID): Promise<WorkoutSet> {
  const db = getOfflineDatabase();
  const sets = await db.workoutSets.where("workoutExerciseId").equals(workoutExerciseId).toArray();
  const now = new Date().toISOString();
  const set: WorkoutSet = {
    id: generateClientId(),
    workoutExerciseId,
    setNumber: Math.max(0, ...sets.map((item) => item.setNumber)) + 1,
    weightKg: null,
    reps: null,
    isWarmup: false,
    isCompleted: false,
    isPersonalRecord: false,
    createdAt: now,
    updatedAt: now,
  };
  await db.workoutSets.add(set);
  await enqueueOfflineMutation(workoutSetMutation("create", set));
  requestSync();
  return set;
}

export async function deleteWorkoutSet(setId: UUID): Promise<void> {
  const db = getOfflineDatabase();
  const set = await db.workoutSets.get(setId);
  if (!set) return;
  await enqueueOfflineMutation(workoutSetMutation("delete", set));
  await db.workoutSets.delete(setId);
  requestSync();
}

export async function updateWorkoutExerciseNotes(
  workoutExerciseId: UUID,
  notes: string,
): Promise<void> {
  const db = getOfflineDatabase();
  const exercise = await db.workoutExercises.get(workoutExerciseId);
  if (!exercise) throw new Error("Workout exercise not found locally.");
  const updated = { ...exercise, notes };
  await db.workoutExercises.put(updated);
  await enqueueOfflineMutation(workoutExerciseMutation("update", { ...updated, sets: [] }));
  requestSync();
}

export async function updateWorkoutSessionNotes(sessionId: UUID, notes: string): Promise<void> {
  const session = await getLocalWorkoutSession(sessionId);
  if (!session) throw new Error("Workout session not found locally.");
  const updated = { ...session, notes, updatedAt: new Date().toISOString() };
  await saveWorkoutLocally(updated);
  await enqueueOfflineMutation(workoutSessionMutation("update", updated));
  requestSync();
}

export async function addExerciseToWorkout(
  sessionId: UUID,
  exerciseId: UUID,
  setCount = 2,
  sessionOnly = true,
): Promise<UUID> {
  const session = await getLocalWorkoutSession(sessionId);
  if (!session) throw new Error("Active workout not found locally.");
  const exercise = await fetchExerciseById(exerciseId);
  if (!exercise) throw new Error("Exercise not found.");

  const now = new Date().toISOString();
  const workoutExerciseId = generateClientId();
  const workoutExercise = {
    id: workoutExerciseId,
    workoutSessionId: sessionId,
    exerciseId,
    order: Math.max(-1, ...session.exercises.map((item) => item.order)) + 1,
    isSessionOnlyAddition: sessionOnly,
    notes: "",
    exercise,
    sets: Array.from({ length: setCount }, (_, index) => ({
      id: generateClientId(),
      workoutExerciseId,
      setNumber: index + 1,
      weightKg: null,
      reps: null,
      isWarmup: false,
      isCompleted: false,
      isPersonalRecord: false,
      createdAt: now,
      updatedAt: now,
    })),
  };

  const updatedSession = {
    ...session,
    updatedAt: now,
    exercises: [...session.exercises, workoutExercise],
  };
  await saveWorkoutLocally(updatedSession);
  await enqueueOfflineMutation(workoutExerciseMutation("create", workoutExercise));
  for (const set of workoutExercise.sets) {
    await enqueueOfflineMutation(workoutSetMutation("create", set));
  }
  requestSync();
  return workoutExerciseId;
}

export async function deleteWorkoutExercise(workoutExerciseId: UUID): Promise<void> {
  const db = getOfflineDatabase();
  const exerciseRow = await db.workoutExercises.get(workoutExerciseId);
  if (!exerciseRow) return;
  const sets = await db.workoutSets.where("workoutExerciseId").equals(workoutExerciseId).toArray();
  const payload: WorkoutExercise = { ...exerciseRow, sets };
  await enqueueOfflineMutation(workoutExerciseMutation("delete", payload));
  await db.transaction("rw", [db.workoutExercises, db.workoutSets], async () => {
    await db.workoutSets.where("workoutExerciseId").equals(workoutExerciseId).delete();
    await db.workoutExercises.delete(workoutExerciseId);
  });
  requestSync();
}

export async function fetchPreviousPerformance(exerciseId: UUID): Promise<WorkoutSet[]> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const currentUser = sessionData.session?.user;
  if (!currentUser) return [];

  const history = await fetchWorkoutHistory(currentUser.id);
  for (const session of history) {
    const match = session.exercises.find((item) => item.exerciseId === exerciseId);
    if (match) return match.sets.filter((set) => set.isCompleted);
  }
  return [];
}

export async function finishWorkoutSession(
  sessionId: UUID,
  durationSeconds = 0,
  notes?: string,
): Promise<WorkoutSessionWithDetails> {
  const session = await getLocalWorkoutSession(sessionId);
  if (!session) throw new Error("The workout session is not available locally.");
  const now = new Date().toISOString();
  const completed: WorkoutSessionWithDetails = {
    ...session,
    status: "completed",
    completedAt: now,
    durationSeconds: Math.max(0, Math.floor(durationSeconds)),
    notes: notes ?? session.notes,
    updatedAt: now,
  };
  await saveWorkoutLocally(completed);
  await enqueueOfflineMutation(workoutSessionMutation("update", completed));
  requestSync();
  return completed;
}


export async function deleteCompletedWorkoutSession(sessionId: UUID): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    throw new Error("Connect to the internet before deleting a completed workout.");
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("delete_own_workout_session", {
    target_session_id: sessionId,
  });

  if (error) throw new Error(error.message);
  await removeLocalWorkoutSession(sessionId);
}

export type { WorkoutSession, WorkoutExercise };
