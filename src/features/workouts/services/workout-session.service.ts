import { NotImplementedError } from "@/lib/utils/errors";
import type { UUID, WorkoutSession } from "@/types";

/**
 * Server-backed workout session operations. Each function is a typed
 * placeholder for now — wire these up to Supabase queries (and the offline
 * queue in `lib/offline` for the create/update paths) as the feature is
 * built out.
 */

export async function fetchWorkoutSessionById(sessionId: UUID): Promise<WorkoutSession | null> {
  void sessionId;
  throw new NotImplementedError("fetchWorkoutSessionById");
}

export async function fetchWorkoutHistory(userId: UUID): Promise<WorkoutSession[]> {
  void userId;
  throw new NotImplementedError("fetchWorkoutHistory");
}

export async function startWorkoutSession(userId: UUID, splitDayId: UUID | null): Promise<WorkoutSession> {
  void userId;
  void splitDayId;
  throw new NotImplementedError("startWorkoutSession");
}

export async function finishWorkoutSession(sessionId: UUID): Promise<WorkoutSession> {
  void sessionId;
  throw new NotImplementedError("finishWorkoutSession");
}
