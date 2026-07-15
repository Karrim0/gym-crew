import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Users } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { createClient } from "@/lib/supabase/server";
import { PersonalDashboardSummary } from "@/features/dashboard/components/PersonalDashboardSummary";
import { PersonalSplitOverviewClient } from "@/features/dashboard/components/PersonalSplitOverviewClient";
import { TodaysWorkoutClient } from "@/features/workouts/components/TodaysWorkoutClient";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership) redirect("/onboarding");

  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name").eq("id", user.id).maybeSingle();
  const displayName = profile?.display_name ?? "Athlete";

  return (
    <>
      <DashboardHeader title={`Hi, ${displayName}`} />
      <PageContainer className="space-y-6 pb-8 pt-4">
        <PersonalSplitOverviewClient userId={user.id} />

        <section>
          <div className="mb-3 px-1">
            <p className="gc-eyebrow">Today</p>
            <h2 className="mt-1 text-xl font-bold">Ready when you are</h2>
          </div>
          <TodaysWorkoutClient userId={user.id} compact />
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between gap-3 px-1">
            <div>
              <p className="gc-eyebrow">This week</p>
              <h2 className="mt-1 text-xl font-bold">Your progress</h2>
            </div>
            <Link href="/progress" className="text-sm font-semibold text-indigo-200">View progress</Link>
          </div>
          <PersonalDashboardSummary userId={user.id} />
        </section>

        <section>
          <div className="mb-3 px-1">
            <p className="gc-eyebrow">Crew</p>
            <h2 className="mt-1 text-xl font-bold">Train together, without the noise</h2>
          </div>
          <Link href="/group" className="gc-card-interactive flex items-center gap-4 p-5">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-300/10 text-indigo-200"><Users className="h-6 w-6" /></span>
            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold">{membership.group.isPersonal ? "Start or join a crew" : membership.group.name}</span>
              <span className="mt-1 block text-sm leading-5 text-neutral-500">{membership.group.isPersonal ? "Create a group when you want activity, members and a leaderboard." : "Activity, leaderboard and members are all in one place."}</span>
            </span>
            <ArrowUpRight className="h-5 w-5 text-neutral-500" />
          </Link>
        </section>
      </PageContainer>
    </>
  );
}
