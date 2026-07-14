import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { cacheExercises, getCachedExercises } from "@/lib/offline";
import type { Exercise, UUID, WorkoutType } from "@/types";

type ExerciseRow = Tables<"exercises">;

export function mapExercise(row: ExerciseRow): Exercise {
  return {
    id: row.id,
    name: row.name,
    primaryMuscle: row.primary_muscle,
    secondaryMuscles: row.secondary_muscles,
    workoutType: row.workout_type as Exercise["workoutType"],
    isCustom: row.is_custom,
    createdBy: row.created_by,
  };
}

function filterByWorkoutType(exercises: Exercise[], workoutType?: WorkoutType) {
  if (!workoutType || workoutType === "rest") return exercises;
  return exercises.filter((exercise) => exercise.workoutType === workoutType);
}

export async function fetchExerciseLibrary(workoutType?: WorkoutType): Promise<Exercise[]> {
  const supabase = createClient();
  try {
    let query = supabase.from("exercises").select("*").order("name");
    if (workoutType && workoutType !== "rest") query = query.eq("workout_type", workoutType);

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    const exercises = data.map(mapExercise);
    await cacheExercises(exercises);
    return exercises;
  } catch (caught) {
    const cached = filterByWorkoutType(await getCachedExercises(), workoutType);
    if (cached.length > 0) return cached.sort((a, b) => a.name.localeCompare(b.name));
    throw caught;
  }
}

export async function fetchExerciseById(exerciseId: UUID): Promise<Exercise | null> {
  const cached = (await getCachedExercises()).find((exercise) => exercise.id === exerciseId);
  if (cached) return cached;

  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  const exercise = data ? mapExercise(data) : null;
  if (exercise) await cacheExercises([exercise]);
  return exercise;
}

export interface CreateCustomExerciseInput {
  name: string;
  primaryMuscle: Exercise["primaryMuscle"];
  secondaryMuscles?: Exercise["secondaryMuscles"];
  workoutType: Exercise["workoutType"];
}

export async function createCustomExercise(
  exercise: CreateCustomExerciseInput,
): Promise<Exercise> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: exercise.name.trim(),
      primary_muscle: exercise.primaryMuscle,
      secondary_muscles: exercise.secondaryMuscles ?? [],
      workout_type: exercise.workoutType,
      is_custom: true,
      created_by: userData.user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  const created = mapExercise(data);
  await cacheExercises([created]);
  return created;
}
