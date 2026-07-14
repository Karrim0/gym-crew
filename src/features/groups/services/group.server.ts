import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/supabase/types";
import type { GroupRole, UUID, WorkoutGroup } from "@/types";

type GroupRow = Tables<"groups">;

export interface ServerGroupMembership {
  groupId: UUID;
  role: GroupRole;
  group: WorkoutGroup;
  seenSplitVersion: number;
}

function mapGroup(row: GroupRow): WorkoutGroup {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    isPersonal: row.is_personal,
    splitVersion: row.split_version,
    splitUpdatedAt: row.split_updated_at,
  };
}

export async function getGroupMembershipForUser(
  userId: UUID
): Promise<ServerGroupMembership | null> {
  const supabase = await createClient();
  const { data: member, error: memberError } = await supabase
    .from("group_members")
    .select("group_id, role, seen_split_version")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!member) return null;

  const { data: group, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", member.group_id)
    .single();

  if (groupError) throw groupError;

  return {
    groupId: member.group_id,
    role: member.role,
    group: mapGroup(group),
    seenSplitVersion: member.seen_split_version,
  };
}
