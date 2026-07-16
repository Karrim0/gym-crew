/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Shield, Trash2, UserRound } from "lucide-react";
import type { GroupRole, UUID } from "@/types";
import { groupRoleLabelAr } from "@/lib/localization";
import type { GroupMemberWeeklyStats, GroupMemberWithProfile } from "../types";
import {
  fetchGroupMembers,
  fetchGroupMemberWeeklyStats,
  removeGroupMember,
  updateGroupMemberRole,
} from "../services/group.service";

interface GroupMembersClientProps {
  groupId: UUID;
  currentUserId: UUID;
  currentRole: GroupRole;
}

export function GroupMembersClient({ groupId, currentUserId, currentRole }: GroupMembersClientProps) {
  const [members, setMembers] = useState<GroupMemberWithProfile[]>([]);
  const [stats, setStats] = useState<GroupMemberWeeklyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [nextMembers, nextStats] = await Promise.all([
        fetchGroupMembers(groupId),
        fetchGroupMemberWeeklyStats(groupId),
      ]);
      setMembers(nextMembers);
      setStats(nextStats);
    } catch (caught) {
      setError(getArabicErrorMessage(caught, "معرفناش نحمّل الأعضاء."));
    } finally {
      setIsLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);
  const statsByUserId = useMemo(() => new Map(stats.map((item) => [item.userId, item])), [stats]);

  async function changeRole(member: GroupMemberWithProfile, role: "admin" | "member") {
    setBusyId(member.id);
    setError(null);
    try { await updateGroupMemberRole(member.id, role); await load(); }
    catch (caught) { setError(getArabicErrorMessage(caught, "معرفناش نغيّر الصلاحية.")); }
    finally { setBusyId(null); }
  }

  async function remove(member: GroupMemberWithProfile) {
    if (!window.confirm(`تشيل ${member.profile.displayName} من الجروب؟`)) return;
    setBusyId(member.id);
    try { await removeGroupMember(member.id); await load(); }
    catch (caught) { setError(getArabicErrorMessage(caught, "معرفناش نشيل العضو.")); }
    finally { setBusyId(null); }
  }

  if (isLoading) return <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />)}</div>;

  return (
    <div className="space-y-3 pb-24">
      {error ? <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {members.map((member) => {
        const isSelf = member.userId === currentUserId;
        const canManage = currentRole === "owner" && member.role !== "owner" && !isSelf;
        const memberStats = statsByUserId.get(member.userId);
        return (
          <article key={member.id} className="rounded-[24px] border bg-white p-4 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
              {member.profile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.profile.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
              ) : <span className="grid h-12 w-12 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800"><UserRound className="h-5 w-5" /></span>}
              <div className="min-w-0 flex-1"><p className="truncate font-bold">{member.profile.displayName}{isSelf ? " (إنت)" : ""}</p><p className="inline-flex items-center gap-1 text-xs capitalize text-neutral-500"><Shield className="h-3 w-3" /> {groupRoleLabelAr(member.role)}</p></div>
              {canManage ? <div className="flex items-center gap-2"><select value={member.role} disabled={busyId === member.id} onChange={(event) => void changeRole(member, event.target.value as "admin" | "member")} className="rounded-lg border bg-transparent px-2 py-1.5 text-sm"><option value="member">عضو</option><option value="admin">أدمن</option></select><button type="button" disabled={busyId === member.id} onClick={() => void remove(member)} className="rounded-lg border p-2 text-red-600" aria-label="شيل العضو"><Trash2 className="h-4 w-4" /></button></div> : null}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              <div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900"><strong className="block">{memberStats?.adherencePercent === null || memberStats?.adherencePercent === undefined ? "—" : `${Math.round(memberStats.adherencePercent)}%`}</strong><span className="text-[11px] text-neutral-500">الالتزام</span></div>
              <div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900"><strong className="block">{memberStats?.sessionsThisWeek ?? "—"}</strong><span className="text-[11px] text-neutral-500">التمرينات</span></div>
              <div className="rounded-xl bg-neutral-50 p-2 dark:bg-neutral-900"><strong className="block">{memberStats?.personalRecordsCount ?? "—"}</strong><span className="text-[11px] text-neutral-500">أرقام</span></div>
            </div>
          </article>
        );
      })}
    </div>
  );
}
