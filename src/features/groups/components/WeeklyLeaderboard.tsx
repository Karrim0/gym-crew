"use client";

import { useEffect, useState } from "react";
import { Medal, Shield, UserRound } from "lucide-react";
import type { UUID } from "@/types";
import type { GroupMemberWeeklyStats } from "../types";
import { fetchGroupMemberWeeklyStats } from "../services/group.service";

export function WeeklyLeaderboard({ groupId, compact = false }: { groupId: UUID; compact?: boolean }) {
  const [members, setMembers] = useState<GroupMemberWeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupMemberWeeklyStats(groupId).then(setMembers).finally(() => setLoading(false));
  }, [groupId]);

  if (loading) return <div className="h-48 animate-pulse rounded-[26px] bg-neutral-100 dark:bg-neutral-900" />;

  const visible = compact ? members.slice(0, 3) : members;
  return (
    <section className="rounded-[26px] border bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div><h3 className="font-black">Weekly consistency</h3><p className="text-sm text-neutral-500">Ranked by adherence, never by who lifts the most.</p></div>
        <Medal className="h-5 w-5 text-amber-500" />
      </div>
      <div className="mt-4 space-y-2">
        {visible.map((member, index) => (
          <article key={member.userId} className="flex items-center gap-3 rounded-2xl bg-neutral-50 p-3 dark:bg-neutral-900">
            <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-black ${index === 0 && member.adherencePercent !== null ? "bg-amber-400 text-neutral-950" : "bg-white dark:bg-neutral-800"}`}>{index + 1}</span>
            {member.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.avatarUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
            ) : <span className="grid h-10 w-10 place-items-center rounded-full bg-white dark:bg-neutral-800"><UserRound className="h-4 w-4" /></span>}
            <div className="min-w-0 flex-1"><p className="truncate font-bold">{member.displayName}</p><p className="inline-flex items-center gap-1 text-xs capitalize text-neutral-500"><Shield className="h-3 w-3" />{member.role}</p></div>
            {member.adherencePercent === null ? (
              <span className="text-xs font-semibold text-neutral-400">Private</span>
            ) : (
              <div className="text-right"><strong className="block text-lg">{Math.round(member.adherencePercent)}%</strong><span className="text-xs text-neutral-500">{member.sessionsThisWeek}/{member.scheduledThisWeek} sessions</span></div>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
