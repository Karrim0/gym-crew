"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ChevronRight, Settings2, ShieldCheck, Users } from "lucide-react";
import type { GroupRole, UUID, WorkoutGroup } from "@/types";
import { GroupInviteCode } from "./GroupInviteCode";
import { GroupSplitUpdateCard } from "./GroupSplitUpdateCard";
import { WeeklyLeaderboard } from "./WeeklyLeaderboard";
import { fetchGroupMembers } from "../services/group.service";

interface GroupOverviewClientProps {
  group: WorkoutGroup;
  role: GroupRole;
  currentUserId: UUID;
}

export function GroupOverviewClient({ group, role, currentUserId }: GroupOverviewClientProps) {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    fetchGroupMembers(group.id).then((members) => setMemberCount(members.length)).catch(() => setMemberCount(null));
  }, [group.id]);

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-[30px] bg-neutral-950 p-5 text-white shadow-sm dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-65">{group.isPersonal ? "Personal training space" : "Your crew"}</p>
        <h2 className="mt-1 text-2xl font-black">{group.name}</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 dark:bg-black/10"><ShieldCheck className="h-4 w-4" /> {role}</span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 dark:bg-black/10"><Users className="h-4 w-4" /> {group.isPersonal ? "Solo" : `${memberCount ?? "—"} members`}</span>
        </div>
      </section>

      {!group.isPersonal ? <GroupSplitUpdateCard userId={currentUserId} /> : null}

      {group.isPersonal ? (
        <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"><p className="font-black">Built for your own progress</p><p className="mt-1 text-sm text-neutral-500">Your split, history, records and analytics work without social features.</p></section>
      ) : (
        <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"><p className="mb-2 text-sm font-bold">Invite your friends</p><GroupInviteCode inviteCode={group.inviteCode} /><p className="mt-2 text-xs text-neutral-500">Anyone with this code can join your group.</p></section>
      )}

      {!group.isPersonal ? <WeeklyLeaderboard groupId={group.id} compact /> : null}

      <div className="grid gap-3">
        {!group.isPersonal ? <Link href="/group/activity" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40"><Activity className="h-5 w-5" /></span><span><span className="block font-black">Crew activity</span><span className="text-sm text-neutral-500">Workouts, records and weekly board</span></span></span><ChevronRight className="h-5 w-5" /></Link> : null}
        {!group.isPersonal ? <Link href="/group/members" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span><span className="block font-black">Members & roles</span><span className="text-sm text-neutral-500">Owner, admin and member permissions</span></span><ChevronRight className="h-5 w-5" /></Link> : null}
        <Link href="/split/group" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span><span className="block font-black">{group.isPersonal ? "Base split" : "Group split"}</span><span className="text-sm text-neutral-500">{group.isPersonal ? "The template behind your personal plan" : "The shared starting schedule"}</span></span><ChevronRight className="h-5 w-5" /></Link>
        {!group.isPersonal ? <Link href="/group/settings" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="flex items-center gap-3"><Settings2 className="h-5 w-5" /><span><span className="block font-black">Privacy settings</span><span className="text-sm text-neutral-500">Choose what friends can see</span></span></span><ChevronRight className="h-5 w-5" /></Link> : null}
      </div>
    </div>
  );
}
