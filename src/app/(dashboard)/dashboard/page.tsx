import Link from "next/link";
import { ChevronRight, Dumbbell, Users } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { GroupInviteCode } from "@/features/groups/components/GroupInviteCode";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();

  return (
    <>
      <DashboardHeader title={`Hey, ${profile?.display_name ?? "athlete"}`} actions={<LogoutButton />} />
      <PageContainer className="space-y-4 pb-8">
        <Link href="/workout/today" className="flex items-center gap-4 rounded-3xl bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 dark:bg-black/10"><Dumbbell className="h-6 w-6" /></span>
          <span className="flex-1"><span className="block text-xl font-bold">Today&apos;s workout</span><span className="text-sm opacity-70">Open your personal schedule and start</span></span>
          <ChevronRight className="h-5 w-5" />
        </Link>

        {membership ? (
          <section className="space-y-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5" />
              <div className="flex-1"><p className="font-bold">{membership.group.name}</p><p className="text-xs capitalize text-neutral-500">{membership.role}</p></div>
              <Link href="/group" className="text-sm font-semibold">Open</Link>
            </div>
            <GroupInviteCode inviteCode={membership.group.inviteCode} />
          </section>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Link href="/split/personal" className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"><p className="font-bold">My split</p><p className="mt-1 text-sm text-neutral-500">Exercises and rest days</p></Link>
          <Link href="/workout/history" className="rounded-2xl border bg-white p-4 dark:bg-neutral-950"><p className="font-bold">History</p><p className="mt-1 text-sm text-neutral-500">Completed workouts</p></Link>
        </div>
      </PageContainer>
    </>
  );
}
