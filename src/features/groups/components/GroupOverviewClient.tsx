"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, ShieldCheck, Users } from "lucide-react";
import type { GroupRole, WorkoutGroup } from "@/types";
import { GroupInviteCode } from "./GroupInviteCode";
import { fetchGroupMembers } from "../services/group.service";

interface GroupOverviewClientProps {
  group: WorkoutGroup;
  role: GroupRole;
}

export function GroupOverviewClient({ group, role }: GroupOverviewClientProps) {
  const [memberCount, setMemberCount] = useState<number | null>(null);

  useEffect(() => {
    fetchGroupMembers(group.id).then((members) => setMemberCount(members.length)).catch(() => setMemberCount(null));
  }, [group.id]);

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-neutral-950 p-5 text-white shadow-sm dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-70">Your crew</p>
        <h2 className="mt-1 text-2xl font-bold">{group.name}</h2>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 dark:bg-black/10">
            <ShieldCheck className="h-4 w-4" /> {role}
          </span>
          <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 dark:bg-black/10">
            <Users className="h-4 w-4" /> {memberCount ?? "—"} members
          </span>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <p className="mb-2 text-sm font-medium">Invite your friends</p>
        <GroupInviteCode inviteCode={group.inviteCode} />
        <p className="mt-2 text-xs text-neutral-500">Anyone with this code can join your group.</p>
      </section>

      <div className="grid gap-3">
        <Link href="/group/members" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span>
            <span className="block font-semibold">Members & roles</span>
            <span className="text-sm text-neutral-500">Owner, admin and member permissions</span>
          </span>
          <ChevronRight className="h-5 w-5" />
        </Link>
        <Link href="/split/group" className="flex items-center justify-between rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span>
            <span className="block font-semibold">Group split</span>
            <span className="text-sm text-neutral-500">Manage the shared PPL schedule</span>
          </span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>
    </div>
  );
}
