import Link from "next/link";
import { ArrowUpRight, BarChart3, CalendarRange, Dumbbell, Sparkles, Users } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { GroupInviteCode } from "@/features/groups/components/GroupInviteCode";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { createClient } from "@/lib/supabase/server";
import { PersonalDashboardSummary } from "@/features/dashboard/components/PersonalDashboardSummary";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.display_name ?? "athlete";

  return (
    <>
      <DashboardHeader title={`Hey, ${displayName}`} actions={<LogoutButton />} />
      <PageContainer className="space-y-5 pb-8 pt-5">
        <section className="relative overflow-hidden rounded-[30px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(183,255,60,.16),rgba(14,18,15,.98)_48%,rgba(8,11,8,.98))] p-5 shadow-[0_30px_80px_rgba(0,0,0,.35)] sm:p-7">
          <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1.5 text-xs font-black text-lime-200">
                <Sparkles className="h-3.5 w-3.5" /> Ready when you are
              </div>
              <h2 className="mt-4 max-w-xl text-3xl font-black leading-[1.03] tracking-[-0.045em] sm:text-5xl">
                Make today&apos;s session count.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-400 sm:text-base">
                Open your planned workout, log each set quickly and let Gym Crew handle the rest.
              </p>
            </div>
            <Link href="/workout/today" className="gc-primary-button w-full lg:w-auto lg:min-w-48">
              <Dumbbell className="h-5 w-5" /> Start workout <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </section>

        <PersonalDashboardSummary userId={user.id} />

        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/split/personal" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-lime-300"><CalendarRange className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">My split</span><span className="block text-xs text-neutral-500">Plan training days</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/progress" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-lime-300"><BarChart3 className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Progress</span><span className="block text-xs text-neutral-500">Charts and PRs</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/workout/history" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-lime-300"><Dumbbell className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">History</span><span className="block text-xs text-neutral-500">Review sessions</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        </div>

        {membership && !membership.group.isPersonal ? (
          <section className="gc-card p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300"><Users className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="gc-eyebrow">Your crew</p>
                <h3 className="mt-1 truncate text-xl font-black">{membership.group.name}</h3>
                <p className="mt-1 text-sm capitalize text-neutral-500">{membership.role} · shared weekly momentum</p>
              </div>
              <Link href="/group" className="gc-secondary-button min-h-10 px-3 py-2 text-xs">Open</Link>
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Invite code</p>
              <GroupInviteCode inviteCode={membership.group.inviteCode} />
            </div>
          </section>
        ) : null}
      </PageContainer>
    </>
  );
}
