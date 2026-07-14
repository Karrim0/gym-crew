import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
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

export async function fetchExerciseLibrary(workoutType?: WorkoutType): Promise<Exercise[]> {
  const supabase = createClient();
  let query = supabase.from("exercises").select("*").order("name");

  if (workoutType && workoutType !== "rest") {
    query = query.eq("workout_type", workoutType);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data.map(mapExercise);
}

export async function fetchExerciseById(exerciseId: UUID): Promise<Exercise | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("id", exerciseId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapExercise(data) : null;
}

export async function createCustomExercise(
  exercise: Omit<Exercise, "id" | "isCustom">,
): Promise<Exercise> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw new Error("You must be signed in.");

  const { data, error } = await supabase
    .from("exercises")
    .insert({
      name: exercise.name.trim(),
      primary_muscle: exercise.primaryMuscle,
      secondary_muscles: exercise.secondaryMuscles,
      workout_type: exercise.workoutType,
      is_custom: true,
      created_by: userData.user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapExercise(data);
}
