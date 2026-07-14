import { NotImplementedError } from "@/lib/utils/errors";
import type { StreakResult } from "@/lib/calculations/streaks";
import type { UUID } from "@/types";

/**
 * Loads a member's completed workout dates and personal rest days, then
 * delegates the actual streak math to `calculateWorkoutStreak` in
 * `lib/calculations/streaks.ts`. Kept as a feature service (rather than
 * folding into `lib/calculations`) because it needs to fetch data, which
 * `lib/calculations` intentionally never does.
 */
export async function fetchWorkoutStreak(userId: UUID): Promise<StreakResult> {
  void userId;
  throw new NotImplementedError("fetchWorkoutStreak");
}
