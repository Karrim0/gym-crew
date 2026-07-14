import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import type {
  GroupActivity,
  GroupMember,
  UserProfile,
  UUID,
  WorkoutGroup,
} from "@/types";
import type { GroupMemberWithProfile } from "../types";

type GroupRow = Tables<"groups">;
type GroupMemberRow = Tables<"group_members">;
type ProfileRow = Tables<"profiles">;
type GroupActivityRow = Tables<"group_activity">;

export interface CurrentGroupMembership {
  member: GroupMember;
  group: WorkoutGroup;
}

function mapGroup(row: GroupRow): WorkoutGroup {
  return {
    id: row.id,
    name: row.name,
    inviteCode: row.invite_code,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapMember(row: GroupMemberRow): GroupMember {
  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at,
  };
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    additionalRestDays: row.additional_rest_days,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapActivity(row: GroupActivityRow): GroupActivity {
  const metadata =
    row.metadata &&
    typeof row.metadata === "object" &&
    !Array.isArray(row.metadata)
      ? (row.metadata as Record<string, unknown>)
      : {};

  return {
    id: row.id,
    groupId: row.group_id,
    userId: row.user_id,
    type: row.activity_type,
    message: row.message,
    metadata,
    createdAt: row.created_at,
  };
}

export async function fetchGroupById(
  groupId: UUID,
): Promise<WorkoutGroup | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .select("*")
    .eq("id", groupId)
    .maybeSingle();

  if (error) throw error;
  return data ? mapGroup(data) : null;
}

export async function fetchCurrentGroupMembership(
  userId: UUID,
): Promise<CurrentGroupMembership | null> {
  const supabase = createClient();
  const { data: memberRow, error: memberError } = await supabase
    .from("group_members")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (memberError) throw memberError;
  if (!memberRow) return null;

  const { data: groupRow, error: groupError } = await supabase
    .from("groups")
    .select("*")
    .eq("id", memberRow.group_id)
    .single();

  if (groupError) throw groupError;

  return {
    member: mapMember(memberRow),
    group: mapGroup(groupRow),
  };
}

export async function fetchGroupMembers(
  groupId: UUID,
): Promise<GroupMemberWithProfile[]> {
  const supabase = createClient();
  const { data: members, error: membersError } = await supabase
    .from("group_members")
    .select("*")
    .eq("group_id", groupId)
    .order("joined_at", { ascending: true });

  if (membersError) throw membersError;
  if (members.length === 0) return [];

  const userIds = members.map((member) => member.user_id);
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", userIds);

  if (profilesError) throw profilesError;

  const profilesById = new Map(
    profiles.map((profile) => [profile.id, mapProfile(profile)]),
  );

  return members.flatMap((member) => {
    const profile = profilesById.get(member.user_id);
    return profile ? [{ ...mapMember(member), profile }] : [];
  });
}

export async function fetchGroupActivity(
  groupId: UUID,
): Promise<GroupActivity[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("group_activity")
    .select("*")
    .eq("group_id", groupId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data.map(mapActivity);
}

export async function createGroup(name: string): Promise<WorkoutGroup> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("create_group_with_owner", {
    group_name: name.trim(),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("The group was not returned after creation.");
  }

  return mapGroup(data);
}

export async function joinGroupByInviteCode(
  inviteCode: string,
): Promise<WorkoutGroup> {
  const supabase = createClient();

  const { data, error } = await supabase.rpc("join_group_by_invite_code", {
    raw_invite_code: inviteCode.trim().toUpperCase(),
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("The group was not returned after joining.");
  }

  return mapGroup(data);
}

export async function updateGroupMemberRole(
  memberId: UUID,
  role: "admin" | "member",
): Promise<GroupMember> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("group_members")
    .update({ role })
    .eq("id", memberId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapMember(data);
}

export async function removeGroupMember(memberId: UUID): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("group_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
}

export async function updateGroupName(groupId: UUID, name: string): Promise<WorkoutGroup> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("groups")
    .update({ name: name.trim() })
    .eq("id", groupId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapGroup(data);
}
