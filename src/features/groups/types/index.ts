import type { GroupMember, UserProfile } from "@/types";

export interface GroupMemberWithProfile extends GroupMember {
  profile: UserProfile;
}
