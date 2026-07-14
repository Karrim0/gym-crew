import Link from "next/link";
import { ArrowUpRight, Dumbbell, Settings, ShieldCheck, UserRound } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Athlete";

  return (
    <>
      <DashboardHeader title="Profile" actions={<LogoutButton />} />
      <PageContainer className="space-y-4 pb-8 pt-5">
        <section className="relative overflow-hidden rounded-[30px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(183,255,60,.14),rgba(14,18,15,.98)_55%)] p-5 sm:p-6">
          <div className="flex items-center gap-4">
            {profile?.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.avatar_url} alt="" className="h-20 w-20 rounded-[24px] border border-white/10 object-cover shadow-xl" />
            ) : (
              <span className="grid h-20 w-20 place-items-center rounded-[24px] bg-lime-300 text-neutral-950"><UserRound className="h-8 w-8" /></span>
            )}
            <div className="min-w-0 flex-1">
              <p className="gc-eyebrow">Athlete profile</p>
              <h2 className="mt-1 truncate text-2xl font-black tracking-[-0.035em]">{displayName}</h2>
              <p className="mt-1 truncate text-sm text-neutral-400">{user.email}</p>
            </div>
          </div>
        </section>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/profile/settings" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300"><Settings className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Edit profile</span><span className="block text-sm text-neutral-500">Name, avatar and rest days</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/split/personal" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><Dumbbell className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Training plan</span><span className="block text-sm text-neutral-500">Manage your personal split</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
        </div>

        <section className="gc-card flex items-start gap-3 p-4">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-lime-300" />
          <div><p className="font-black">Private training data</p><p className="mt-1 text-sm leading-6 text-neutral-500">Your raw sets and workout history stay private. Group privacy settings only share small activity summaries.</p></div>
        </section>
      </PageContainer>
    </>
  );
}
