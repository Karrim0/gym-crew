import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import type { UUID, WorkoutExercise, WorkoutSession, WorkoutSet } from "@/types";
import { mapExercise } from "@/features/exercises/services/exercise.service";
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

function mapSet(row: WorkoutSetRow): WorkoutSet {
  return {
    id: row.id,
    workoutExerciseId: row.workout_exercise_id,
    setNumber: row.set_number,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    reps: row.reps,
    isWarmup: row.is_warmup,
    isCompleted: row.is_completed,
    isPersonalRecord: false,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapWorkoutExercise(row: WorkoutExerciseQueryRow) {
  return {
    id: row.id,
    workoutSessionId: row.workout_session_id,
    exerciseId: row.exercise_id,
    order: row.position,
    isSessionOnlyAddition: row.is_session_only_addition,
    notes: row.notes,
    exercise: mapExercise(row.exercises),
    sets: [...row.workout_sets].sort((a, b) => a.set_number - b.set_number).map(mapSet),
  };
}

function mapSession(row: WorkoutSessionQueryRow): WorkoutSessionWithDetails {
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
      .map(mapWorkoutExercise),
  };
}

const SESSION_SELECT = "*, workout_exercises(*, exercises(*), workout_sets(*))";

export async function fetchWorkoutSessionById(sessionId: UUID): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("id", sessionId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data as unknown as WorkoutSessionQueryRow) : null;
}

export async function fetchActiveWorkoutSession(): Promise<WorkoutSessionWithDetails | null> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userData.user.id)
    .eq("status", "in_progress")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapSession(data as unknown as WorkoutSessionQueryRow) : null;
}

export async function fetchWorkoutHistory(userId: UUID): Promise<WorkoutSessionWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(error.message);
  return (data as unknown as WorkoutSessionQueryRow[]).map(mapSession);
}

export async function startWorkoutSession(
  _userId: UUID,
  splitDayId: UUID,
  scheduledDate = new Date().toISOString().slice(0, 10),
): Promise<WorkoutSessionWithDetails> {
  const supabase = createClient();
  const { data: sessionId, error } = await supabase.rpc("start_workout_from_split", {
    target_split_day_id: splitDayId,
    target_scheduled_date: scheduledDate,
  });

  if (error) throw new Error(error.message);
  const session = await fetchWorkoutSessionById(sessionId);
  if (!session) throw new Error("The workout session could not be loaded.");
  return session;
}

export async function updateWorkoutSet(
  setId: UUID,
  values: { weightKg: number | null; reps: number | null; isCompleted: boolean; isWarmup?: boolean },
): Promise<WorkoutSet> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("workout_sets")
    .update({
      weight_kg: values.weightKg,
      reps: values.reps,
      is_completed: values.isCompleted,
      ...(values.isWarmup !== undefined ? { is_warmup: values.isWarmup } : {}),
    })
    .eq("id", setId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapSet(data);
}

export async function addWorkoutSet(workoutExerciseId: UUID): Promise<WorkoutSet> {
  const supabase = createClient();
  const { data: setId, error } = await supabase.rpc("add_workout_set", {
    target_workout_exercise_id: workoutExerciseId,
  });
  if (error) throw new Error(error.message);

  const { data, error: fetchError } = await supabase
    .from("workout_sets")
    .select("*")
    .eq("id", setId)
    .single();
  if (fetchError) throw new Error(fetchError.message);
  return mapSet(data);
}

export async function deleteWorkoutSet(setId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workout_sets").delete().eq("id", setId);
  if (error) throw new Error(error.message);
}

export async function updateWorkoutExerciseNotes(
  workoutExerciseId: UUID,
  notes: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_exercises")
    .update({ notes })
    .eq("id", workoutExerciseId);
  if (error) throw new Error(error.message);
}

export async function updateWorkoutSessionNotes(sessionId: UUID, notes: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("workout_sessions")
    .update({ notes })
    .eq("id", sessionId);
  if (error) throw new Error(error.message);
}

export async function addExerciseToWorkout(
  sessionId: UUID,
  exerciseId: UUID,
  setCount = 3,
  sessionOnly = true,
): Promise<UUID> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("add_workout_exercise", {
    target_session_id: sessionId,
    target_exercise_id: exerciseId,
    target_set_count: setCount,
    session_only: sessionOnly,
  });
  if (error) throw new Error(error.message);
  return data;
}

export async function deleteWorkoutExercise(workoutExerciseId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("workout_exercises").delete().eq("id", workoutExerciseId);
  if (error) throw new Error(error.message);
}

export async function fetchPreviousPerformance(exerciseId: UUID): Promise<WorkoutSet[]> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return [];

  const { data, error } = await supabase
    .from("workout_sessions")
    .select(SESSION_SELECT)
    .eq("user_id", userData.user.id)
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  const sessions = (data as unknown as WorkoutSessionQueryRow[]).map(mapSession);
  for (const session of sessions) {
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
  const supabase = createClient();
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("workout_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      duration_seconds: Math.max(0, Math.floor(durationSeconds)),
      ...(notes !== undefined ? { notes } : {}),
    })
    .eq("id", sessionId);

  if (error) throw new Error(error.message);
  const session = await fetchWorkoutSessionById(sessionId);
  if (!session) throw new Error("The completed workout could not be loaded.");
  return session;
}

export type { WorkoutSession, WorkoutExercise };
