import { NotImplementedError } from "@/lib/utils/errors";
import type { UUID } from "@/types";

export interface AdherenceSummary {
  weekly: number | null;
  monthly: number | null;
}

export async function fetchAdherenceSummary(userId: UUID): Promise<AdherenceSummary> {
  void userId;
  throw new NotImplementedError("fetchAdherenceSummary");
}

export interface ExerciseProgressPoint {
  date: string;
  maxWeightKg: number;
  volume: number;
}

export async function fetchExerciseProgressHistory(
  userId: UUID,
  exerciseId: UUID
): Promise<ExerciseProgressPoint[]> {
  void userId;
  void exerciseId;
  throw new NotImplementedError("fetchExerciseProgressHistory");
}
