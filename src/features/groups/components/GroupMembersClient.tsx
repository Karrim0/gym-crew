/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield, Trash2, UserRound } from "lucide-react";
import type { GroupRole, UUID } from "@/types";
import type { GroupMemberWithProfile } from "../types";
import { fetchGroupMembers, removeGroupMember, updateGroupMemberRole } from "../services/group.service";

interface GroupMembersClientProps {
  groupId: UUID;
  currentUserId: UUID;
  currentRole: GroupRole;
}

export function GroupMembersClient({ groupId, currentUserId, currentRole }: GroupMembersClientProps) {
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setMembers(await fetchGroupMembers(groupId));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load members.");
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  async function changeRole(member: GroupMemberWithProfile, role: "admin" | "member") {
    setBusyId(member.id);
    setError(null);
    try {
      await updateGroupMemberRole(member.id, role);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to update the role.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(member: GroupMemberWithProfile) {
    if (!window.confirm(`Remove ${member.profile.displayName} from the group?`)) return;
    setBusyId(member.id);
    try {
      await removeGroupMember(member.id);
      await load();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to remove the member.");
    } finally {
      setBusyId(null);
    }
  }

  if (isLoading) return <p className="py-8 text-center text-sm text-neutral-500">Loading members…</p>;

  return (
    <div className="space-y-3">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const canManage = currentRole === "owner" && member.role !== "owner" && !isSelf;
        return (
          <article key={member.id} className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
            {member.profile.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.profile.avatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
            ) : (
              <span className="grid h-11 w-11 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800"><UserRound className="h-5 w-5" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold">{member.profile.displayName}{isSelf ? " (you)" : ""}</p>
              <p className="inline-flex items-center gap-1 text-xs capitalize text-neutral-500"><Shield className="h-3 w-3" /> {member.role}</p>
            </div>
            {canManage ? (
              <div className="flex items-center gap-2">
                <select
                  value={member.role}
                  disabled={busyId === member.id}
                  onChange={(event) => void changeRole(member, event.target.value as "admin" | "member")}
                  className="rounded-lg border bg-transparent px-2 py-1.5 text-sm"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="button" disabled={busyId === member.id} onClick={() => void remove(member)} className="rounded-lg border p-2 text-red-600" aria-label="Remove member">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
