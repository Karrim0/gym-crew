"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Settings2, ShieldCheck, Users } from "lucide-react";
import type { GroupRole, UUID, WorkoutGroup } from "@/types";
import { GroupInviteCode } from "./GroupInviteCode";
import { GroupSplitUpdateCard } from "./GroupSplitUpdateCard";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";
import { GroupActivityFeedClient } from "./GroupActivityFeedClient";
import { fetchGroupMembers } from "../services/group.service";

interface GroupOverviewClientProps {
  group: WorkoutGroup;
  role: GroupRole;
  currentUserId: UUID;
}

export function GroupOverviewClient({ group, role, currentUserId }: GroupOverviewClientProps) {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    void fetchGroupMembers(group.id)
      .then((members) => { if (active) setMemberCount(members.length); })
      .catch(() => { if (active) setMemberCount(null); });
    return () => { active = false; };
  }, [group.id]);

  if (group.isPersonal) {
    return (
      <div className="space-y-4 pb-8 pt-4">
        <section className="gc-card p-5 sm:p-6">
          <p className="gc-eyebrow">Solo workspace</p>
          <h2 className="mt-2 text-2xl font-bold">{group.name}</h2>
          <p className="mt-2 text-sm leading-6 text-neutral-500">This private workspace supports your personal split and analytics. Social tools stay hidden until you join a real crew.</p>
          <Link href="/split/personal" className="gc-primary-button mt-5">Open personal split <ArrowUpRight className="h-4 w-4" /></Link>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8 pt-4">
      <section className="gc-card p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><Users className="h-6 w-6" /></span>
          <div className="min-w-0 flex-1">
            <p className="gc-eyebrow">Your crew</p>
            <h2 className="mt-1 truncate text-2xl font-bold tracking-[-0.025em]">{group.name}</h2>
            <div className="mt-3 flex flex-wrap gap-2"><span className="gc-chip"><ShieldCheck className="h-3.5 w-3.5 text-indigo-200" /> {role}</span><span className="gc-chip"><Users className="h-3.5 w-3.5 text-indigo-200" /> {memberCount ?? "—"} members</span></div>
          </div>
        </div>
      </section>

      <GroupSplitUpdateCard userId={currentUserId} />

      <section className="gc-card p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div><p className="gc-eyebrow">Invite</p><h3 className="mt-1 font-bold">Bring someone into the crew</h3></div>
          <Link href="/group/members" className="text-xs font-semibold text-indigo-200">Manage members</Link>
        </div>
        <div className="mt-3"><GroupInviteCode inviteCode={group.inviteCode} /></div>
      </section>

      <section>
        <div className="mb-3 flex items-end justify-between gap-3"><div><p className="gc-eyebrow">This week</p><h3 className="mt-1 text-xl font-bold">Leaderboard</h3></div><Link href="/group/activity" className="text-xs font-semibold text-indigo-200">Full activity</Link></div>
        <WeeklyLeaderboard groupId={group.id} compact />
      </section>

      <section>
        <div className="mb-3"><p className="gc-eyebrow">Latest</p><h3 className="mt-1 text-xl font-bold">Crew activity</h3><p className="mt-1 text-sm text-neutral-500">Only summaries each member chose to share.</p></div>
        <GroupActivityFeedClient groupId={group.id} />
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link href="/group/members" className="gc-card-interactive flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Users className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">Members</span><span className="block text-xs text-neutral-500">Roles and stats</span></span><ArrowUpRight className="h-4 w-4 text-neutral-600" /></Link>
        <Link href="/split/group" className="gc-card-interactive flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><ShieldCheck className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">Group split</span><span className="block text-xs text-neutral-500">Shared template</span></span><ArrowUpRight className="h-4 w-4 text-neutral-600" /></Link>
        <Link href="/group/settings" className="gc-card-interactive flex items-center gap-3 p-4"><span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Settings2 className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">Privacy</span><span className="block text-xs text-neutral-500">What friends can see</span></span><ArrowUpRight className="h-4 w-4 text-neutral-600" /></Link>
      </section>

      <Link href="/group/activity" className="gc-secondary-button w-full"><Activity className="h-4 w-4" /> Open full crew activity</Link>
    </div>
  );
}
