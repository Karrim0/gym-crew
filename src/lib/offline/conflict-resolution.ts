import { NotImplementedError } from "@/lib/utils/errors";
import type { WorkoutSession } from "@/types";

export type ConflictResolutionStrategy = "last-write-wins" | "server-wins" | "manual";

/**
 * Resolves a conflict between a locally-modified workout session and the
 * server's version of the same session (matched by `clientId`).
 *
 * Left as a documented placeholder: the real rule set needs product input
 * (e.g. should a completed set ever be overwritten by an older local draft?)
 * before it can be implemented correctly.
 */
export async function resolveWorkoutSessionConflict(
  local: WorkoutSession,
  remote: WorkoutSession,
  strategy: ConflictResolutionStrategy = "last-write-wins"
): Promise<WorkoutSession> {
  void local;
  void remote;
  void strategy;
  throw new NotImplementedError("resolveWorkoutSessionConflict");
}
