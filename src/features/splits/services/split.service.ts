import { NotImplementedError } from "@/lib/utils/errors";
import type { SplitDay, UUID, Weekday } from "@/types";

/** Fetches the group's shared default split (not customized per member). */
export async function fetchGroupSplit(groupId: UUID): Promise<SplitDay[]> {
  void groupId;
  throw new NotImplementedError("fetchGroupSplit");
}

/** Fetches a member's personal split copy (falls back to the group split until customized). */
export async function fetchPersonalSplit(userId: UUID): Promise<SplitDay[]> {
  void userId;
  throw new NotImplementedError("fetchPersonalSplit");
}

/** Resets a member's personal split back to the group's default. */
export async function resetPersonalSplitToGroup(userId: UUID): Promise<SplitDay[]> {
  void userId;
  throw new NotImplementedError("resetPersonalSplitToGroup");
}

/** Updates a member's chosen additional rest days (Friday is always fixed, see `constants/schedule`). */
export async function updatePersonalRestDays(
  userId: UUID,
  additionalRestDays: Weekday[]
): Promise<void> {
  void userId;
  void additionalRestDays;
  throw new NotImplementedError("updatePersonalRestDays");
}
