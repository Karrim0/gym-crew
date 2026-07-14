import type { MuscleGroup } from "@/types";

export interface MuscleActivityLevel {
  muscle: MuscleGroup;
  /** 0 (untrained recently) to 1 (heavily trained recently). */
  intensity: number;
}
