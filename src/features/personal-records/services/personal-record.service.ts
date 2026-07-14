import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { fetchWorkoutHistory } from "@/features/workouts/services/workout-session.service";
import type { PersonalRecordType, UUID, WorkoutSet } from "@/types";
import type { PersonalRecordWithExerciseName } from "../types";

type PersonalRecordRow = Tables<"personal_records">;
type ExerciseRow = Tables<"exercises">;
type RecordQueryRow = PersonalRecordRow & { exercises: Pick<ExerciseRow, "name" | "primary_muscle"> };

function mapRecord(row: RecordQueryRow): PersonalRecordWithExerciseName {
  return {
    id: row.id,
    userId: row.user_id,
    exerciseId: row.exercise_id,
    type: row.record_type,
    value: Number(row.value),
    achievedAt: row.achieved_at,
    workoutSetId: row.workout_set_id,
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
    reps: row.reps,
    exerciseName: row.exercises.name,
    primaryMuscle: row.exercises.primary_muscle,
  };
}

function candidateValue(type: PersonalRecordType, set: WorkoutSet): number | null {
  if (!set.isCompleted || set.isWarmup) return null;
  if (type === "max_weight") return set.weightKg;
  if (type === "max_reps") return set.reps;
  if (set.weightKg === null || set.reps === null) return null;
  return set.weightKg * set.reps;
}

async function calculateRecordsFromHistory(userId: UUID): Promise<PersonalRecordWithExerciseName[]> {
  const history = await fetchWorkoutHistory(userId);
  const records = new Map<string, PersonalRecordWithExerciseName>();
  const types: PersonalRecordType[] = ["max_weight", "max_reps", "max_volume"];

  for (const session of history) {
    for (const workoutExercise of session.exercises) {
      for (const set of workoutExercise.sets) {
        for (const type of types) {
          const value = candidateValue(type, set);
          if (value === null) continue;
          const key = `${workoutExercise.exerciseId}:${type}`;
          const previous = records.get(key);
          if (!previous || value > previous.value) {
            records.set(key, {
              id: `${set.id}-${type}`,
              userId,
              exerciseId: workoutExercise.exerciseId,
              type,
              value,
              achievedAt: session.completedAt ?? set.updatedAt,
              workoutSetId: set.id,
              weightKg: set.weightKg,
              reps: set.reps,
              exerciseName: workoutExercise.exercise.name,
              primaryMuscle: workoutExercise.exercise.primaryMuscle,
            });
          }
        }
      }
    }
  }

  return [...records.values()];
}

export async function fetchPersonalRecords(userId: UUID): Promise<PersonalRecordWithExerciseName[]> {
  const localRecords = await calculateRecordsFromHistory(userId);
  const merged = new Map(localRecords.map((record) => [`${record.exerciseId}:${record.type}`, record]));

  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("personal_records")
      .select("*, exercises(name, primary_muscle)")
      .eq("user_id", userId)
      .order("achieved_at", { ascending: false });

    if (error) throw new Error(error.message);
    for (const row of data as unknown as RecordQueryRow[]) {
      const record = mapRecord(row);
      const key = `${record.exerciseId}:${record.type}`;
      const local = merged.get(key);
      if (!local || record.value >= local.value) merged.set(key, record);
    }
  } catch {
    // Unsynced local history still produces accurate personal records offline.
  }

  return [...merged.values()].sort((a, b) => b.achievedAt.localeCompare(a.achievedAt));
}
