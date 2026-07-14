import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import type { Exercise, SplitExercise, UUID, Weekday } from "@/types";
import { cachePersonalSplit, getCachedPersonalSplit, cacheProfile, getCachedProfile } from "@/lib/offline";
import { mapExercise } from "@/features/exercises/services/exercise.service";
import type { SplitDayWithDetails, SplitExerciseWithDetails } from "../types";
import { personalRestDaySchema } from "../schemas/personal-rest-day.schema";

type SplitDayRow = Tables<"split_days">;
type SplitExerciseRow = Tables<"split_exercises">;
type ExerciseRow = Tables<"exercises">;

type SplitExerciseQueryRow = SplitExerciseRow & { exercises: ExerciseRow };
type SplitDayQueryRow = SplitDayRow & { split_exercises: SplitExerciseQueryRow[] };

function mapSplitExercise(row: SplitExerciseQueryRow): SplitExerciseWithDetails {
  return {
    id: row.id,
    splitDayId: row.split_day_id,
    exerciseId: row.exercise_id,
    order: row.position,
    targetSets: row.target_sets,
    targetRepsMin: row.target_reps_min,
    targetRepsMax: row.target_reps_max,
    isPersonalAddition: row.is_personal_addition,
    exercise: mapExercise(row.exercises),
  };
}

function mapSplitDay(row: SplitDayQueryRow): SplitDayWithDetails {
  return {
    id: row.id,
    groupId: row.group_id,
    ownerUserId: row.owner_user_id,
    weekday: row.weekday,
    workoutType: row.workout_type,
    displayName: row.display_name,
    exercises: [...row.split_exercises]
      .sort((a, b) => a.position - b.position)
      .map(mapSplitExercise),
  };
}

async function fetchSplitRows(
  mode: "group" | "personal",
  identifier: UUID,
): Promise<SplitDayWithDetails[]> {
  const supabase = createClient();
  let query = supabase
    .from("split_days")
    .select("*, split_exercises(*, exercises(*))")
    .order("created_at", { ascending: true });

  query = mode === "group"
    ? query.eq("group_id", identifier).is("owner_user_id", null)
    : query.eq("owner_user_id", identifier);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data as unknown as SplitDayQueryRow[]).map(mapSplitDay);
}

export async function fetchGroupSplit(groupId: UUID): Promise<SplitDayWithDetails[]> {
  return fetchSplitRows("group", groupId);
}

export async function fetchPersonalSplit(userId: UUID): Promise<SplitDayWithDetails[]> {
  const supabase = createClient();
  try {
    const { error } = await supabase.rpc("ensure_personal_split");
    if (error) throw new Error(error.message);
    const days = await fetchSplitRows("personal", userId);
    await cachePersonalSplit(days);
    return days;
  } catch (caught) {
    const cached = await getCachedPersonalSplit(userId);
    if (cached.length > 0) return cached;
    throw caught;
  }
}

export async function resetPersonalSplitToGroup(userId: UUID): Promise<SplitDayWithDetails[]> {
  const supabase = createClient();
  const { error } = await supabase.rpc("reset_personal_split_to_group");
  if (error) throw new Error(error.message);
  const days = await fetchSplitRows("personal", userId);
  await cachePersonalSplit(days);
  return days;
}

export async function updatePersonalRestDays(
  userId: UUID,
  additionalRestDays: Weekday[],
): Promise<void> {
  const parsed = personalRestDaySchema.parse({ additionalRestDays });
  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ additional_rest_days: parsed.additionalRestDays })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  const cachedProfile = await getCachedProfile(userId);
  if (cachedProfile) {
    await cacheProfile({
      ...cachedProfile,
      additionalRestDays: parsed.additionalRestDays,
      updatedAt: new Date().toISOString(),
    });
  }
}

export async function updateSplitDaySettings(
  splitDayId: UUID,
  workoutType: SplitDayWithDetails["workoutType"],
  displayName: string,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("update_split_day_settings", {
    target_split_day_id: splitDayId,
    target_workout_type: workoutType,
    target_display_name: displayName.trim() || undefined,
  });
  if (error) throw new Error(error.message);
}

export async function clearSplitDay(splitDayId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("split_exercises").delete().eq("split_day_id", splitDayId);
  if (error) throw new Error(error.message);
}

export interface AddSplitExerciseInput {
  splitDayId: UUID;
  exercise: Exercise;
  targetSets?: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  isPersonalAddition?: boolean;
}

export async function addSplitExercise({
  splitDayId,
  exercise,
  targetSets = 2,
  targetRepsMin = 8,
  targetRepsMax = 12,
  isPersonalAddition = false,
}: AddSplitExerciseInput): Promise<SplitExercise> {
  const supabase = createClient();
  const { data: existingRows, error: positionError } = await supabase
    .from("split_exercises")
    .select("position")
    .eq("split_day_id", splitDayId)
    .order("position", { ascending: false })
    .limit(1);

  if (positionError) throw new Error(positionError.message);
  const position = (existingRows[0]?.position ?? -1) + 1;

  const { data, error } = await supabase
    .from("split_exercises")
    .insert({
      split_day_id: splitDayId,
      exercise_id: exercise.id,
      position,
      target_sets: targetSets,
      target_reps_min: targetRepsMin,
      target_reps_max: targetRepsMax,
      is_personal_addition: isPersonalAddition,
    })
    .select("*")
    .single();

  if (error) {
    if (error.code === "23505") throw new Error("This exercise is already in that day.");
    throw new Error(error.message);
  }

  return {
    id: data.id,
    splitDayId: data.split_day_id,
    exerciseId: data.exercise_id,
    order: data.position,
    targetSets: data.target_sets,
    targetRepsMin: data.target_reps_min,
    targetRepsMax: data.target_reps_max,
    isPersonalAddition: data.is_personal_addition,
  };
}

export async function updateSplitExerciseTargets(
  splitExerciseId: UUID,
  values: { targetSets: number; targetRepsMin: number; targetRepsMax: number },
): Promise<void> {
  if (values.targetSets < 1 || values.targetSets > 20) throw new Error("Sets must be between 1 and 20.");
  if (values.targetRepsMin < 1 || values.targetRepsMax < values.targetRepsMin) {
    throw new Error("Check the target rep range.");
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("split_exercises")
    .update({
      target_sets: values.targetSets,
      target_reps_min: values.targetRepsMin,
      target_reps_max: values.targetRepsMax,
    })
    .eq("id", splitExerciseId);

  if (error) throw new Error(error.message);
}

export async function removeSplitExercise(splitExerciseId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("split_exercises").delete().eq("id", splitExerciseId);
  if (error) throw new Error(error.message);
}

export async function moveSplitExercise(splitExerciseId: UUID, direction: -1 | 1): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("move_split_exercise", {
    target_split_exercise_id: splitExerciseId,
    direction,
  });
  if (error) throw new Error(error.message);
}
