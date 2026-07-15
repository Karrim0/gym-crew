import Link from "next/link";
import { ArrowUpRight, Award, CircleUserRound, Dumbbell, History, Map, Settings2, Users } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";

const personalLinks = [
  { href: "/workout/history", title: "Workout history", description: "Review or delete past sessions", icon: History },
  { href: "/progress/records", title: "Personal records", description: "Best weight, reps and set volume", icon: Award },
  { href: "/progress/body-map", title: "Body map", description: "See muscle balance over time", icon: Map },
  { href: "/profile", title: "Profile", description: "Account and personal settings", icon: CircleUserRound },
];

export default async function MorePage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);

  return (
    <>
      <DashboardHeader title="More" />
      <PageContainer className="space-y-6 pb-8 pt-4">
        <section>
          <p className="gc-eyebrow">Personal tools</p>
          <h2 className="mt-1 text-xl font-bold">Everything outside your daily flow</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {personalLinks.map((item) => {
              const Icon = item.icon;
              return <Link key={item.href} href={item.href} className="gc-card-interactive flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Icon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">{item.title}</span><span className="block text-xs text-neutral-500">{item.description}</span></span><ArrowUpRight className="h-4 w-4 text-neutral-600" /></Link>;
            })}
          </div>
        </section>

        <section>
          <p className="gc-eyebrow">Crew</p>
          <h2 className="mt-1 text-xl font-bold">Group features in one place</h2>
          {membership && !membership.group.isPersonal ? (
            <Link href="/group" className="gc-card-interactive mt-3 flex items-center gap-3 p-5">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><Users className="h-6 w-6" /></span>
              <span className="min-w-0 flex-1"><span className="block text-lg font-bold">{membership.group.name}</span><span className="block text-sm text-neutral-500">Activity, leaderboard, invite, members, split and privacy</span></span>
              <ArrowUpRight className="h-5 w-5 text-neutral-600" />
            </Link>
          ) : (
            <section className="gc-card mt-3 p-5"><Dumbbell className="h-5 w-5 text-indigo-200" /><h3 className="mt-3 font-semibold">You are using Solo mode</h3><p className="mt-1 text-sm text-neutral-500">Your personal split and progress work independently. Group features stay out of the way.</p></section>
          )}
        </section>

        <Link href="/profile/settings" className="gc-card-interactive flex items-center gap-3 p-4"><span className="grid h-11 w-11 place-items-center rounded-xl bg-white/[0.045] text-indigo-200"><Settings2 className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block font-semibold">App & profile settings</span><span className="block text-xs text-neutral-500">Name, avatar, privacy and rest days</span></span><ArrowUpRight className="h-4 w-4 text-neutral-600" /></Link>
      </PageContainer>
    </>
  );
}
