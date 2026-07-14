"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, ArrowUpRight, Settings2, ShieldCheck, Users } from "lucide-react";
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
    let active = true;
    void fetchGroupMembers(group.id)
      .then((members) => { if (active) setMemberCount(members.length); })
      .catch(() => { if (active) setMemberCount(null); });
    return () => { active = false; };
  }, [group.id]);

  return (
    <div className="space-y-4 pb-24 pt-5">
      <section className="relative overflow-hidden rounded-[30px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(183,255,60,.15),rgba(14,18,15,.98)_55%)] p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl" />
        <div className="relative">
          <p className="gc-eyebrow">{group.isPersonal ? "Personal space" : "Your crew"}</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.045em] sm:text-4xl">{group.name}</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="gc-chip"><ShieldCheck className="h-4 w-4 text-lime-300" /> {role}</span>
            <span className="gc-chip"><Users className="h-4 w-4 text-lime-300" /> {group.isPersonal ? "Solo" : `${memberCount ?? "—"} members`}</span>
          </div>
        </div>
      </section>

      {!group.isPersonal ? <GroupSplitUpdateCard userId={currentUserId} /> : null}

      {group.isPersonal ? (
        <section className="gc-card p-4 sm:p-5">
          <p className="font-black">Built around your own progress</p>
          <p className="mt-1 text-sm leading-6 text-neutral-500">Your split, history, records and analytics work without any social features.</p>
        </section>
      ) : (
        <section className="gc-card p-4 sm:p-5">
          <p className="gc-eyebrow">Invite friends</p>
          <h3 className="mt-1 font-black">Grow your crew</h3>
          <div className="mt-3"><GroupInviteCode inviteCode={group.inviteCode} /></div>
          <p className="mt-2 text-xs text-neutral-500">Anyone with this code can request access to this group.</p>
        </section>
      )}

      {!group.isPersonal ? <WeeklyLeaderboard groupId={group.id} compact /> : null}

      <div className="grid gap-3 md:grid-cols-2">
        {!group.isPersonal ? (
          <Link href="/group/activity" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300"><Activity className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Crew activity</span><span className="block text-sm text-neutral-500">Workouts, records and weekly board</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        ) : null}
        {!group.isPersonal ? (
          <Link href="/group/members" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><Users className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Members & roles</span><span className="block text-sm text-neutral-500">Owner, admin and member access</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        ) : null}
        <Link href="/split/group" className="gc-card-interactive flex items-center gap-3 p-4">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><ShieldCheck className="h-5 w-5" /></span>
          <span className="min-w-0 flex-1"><span className="block font-black">{group.isPersonal ? "Base split" : "Group split"}</span><span className="block text-sm text-neutral-500">{group.isPersonal ? "Template behind your personal plan" : "Shared starting schedule"}</span></span>
          <ArrowUpRight className="h-4 w-4 text-neutral-600" />
        </Link>
        {!group.isPersonal ? (
          <Link href="/group/settings" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><Settings2 className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Privacy settings</span><span className="block text-sm text-neutral-500">Choose what friends can see</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        ) : null}
      </div>
    </div>
  );
}
