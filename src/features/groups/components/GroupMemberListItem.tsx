import { groupRoleLabelAr } from "@/lib/localization";
import type { GroupMemberWithProfile } from "../types";

export interface GroupMemberListItemProps {
  member: GroupMemberWithProfile;
}

/** Minimal placeholder row for a single group member. */
export function GroupMemberListItem({ member }: GroupMemberListItemProps) {
  return (
    <li className="flex items-center justify-between p-2">
      <span>{member.profile.displayName}</span>
      <span className="text-xs capitalize opacity-70">{groupRoleLabelAr(member.role)}</span>
    </li>
  );
}
