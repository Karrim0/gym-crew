import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, ArrowUpRight, Award, BarChart3, History, Users } from "lucide-react";
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
      <PageContainer className="space-y-4 pb-8 pt-4">
        <PersonalSplitOverviewClient userId={user.id} />

        <section>
          <div className="mb-2 px-1">
            <p className="gc-eyebrow">Priority 2 · Train today</p>
          </div>
          <TodaysWorkoutClient userId={user.id} compact />
        </section>

        <section className="pt-2">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><p className="gc-eyebrow">Your details</p><h2 className="mt-1 text-xl font-bold">Progress at a glance</h2></div>
            <Link href="/progress" className="text-sm font-semibold text-indigo-200">Open progress</Link>
          </div>
          <PersonalDashboardSummary userId={user.id} />
        </section>

        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/workout/history" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><History className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">History</span><span className="block text-xs text-neutral-500">Past sessions</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/progress/records" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Award className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">Records</span><span className="block text-xs text-neutral-500">Your best sets</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/progress/body-map" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><BarChart3 className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-semibold">Body map</span><span className="block text-xs text-neutral-500">Muscle balance</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        </div>

        {membership && !membership.group.isPersonal ? (
          <section className="gc-card p-4 sm:p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><Users className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1"><p className="gc-eyebrow">Crew</p><h3 className="truncate font-bold">{membership.group.name}</h3></div>
              <Link href="/group" className="gc-secondary-button px-3">Open <ArrowUpRight className="h-4 w-4" /></Link>
            </div>
            <p className="mt-3 flex items-center gap-2 text-sm text-neutral-500"><Activity className="h-4 w-4" /> Group activity, leaderboard, members and privacy now live together in one hub.</p>
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}
