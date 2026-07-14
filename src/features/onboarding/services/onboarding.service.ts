import type { UUID } from "@/types";
import { fetchCurrentGroupMembership } from "@/features/groups/services/group.service";

export type PostAuthDestination = "/dashboard" | "/onboarding";

/** Group membership is the single source of truth for onboarding completion. */
export async function resolvePostAuthDestination(userId: UUID): Promise<PostAuthDestination> {
  const membership = await fetchCurrentGroupMembership(userId);
  return membership ? "/dashboard" : "/onboarding";
}
