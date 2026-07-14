import Link from "next/link";
import { Settings, UserRound } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const user = await requireCurrentUser();
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).maybeSingle();
  const displayName = profile?.display_name ?? user.email?.split("@")[0] ?? "Athlete";

  return (
    <>
      <DashboardHeader title="Profile" actions={<LogoutButton />} />
      <PageContainer className="space-y-4 pb-8">
        <section className="flex items-center gap-4 rounded-2xl border bg-white p-5 dark:bg-neutral-950">
          {profile?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-16 w-16 rounded-full border object-cover" />
          ) : (
            <span className="grid h-16 w-16 place-items-center rounded-full bg-neutral-100 dark:bg-neutral-800"><UserRound className="h-7 w-7" /></span>
          )}
          <div><h2 className="text-xl font-bold">{displayName}</h2><p className="text-sm text-neutral-500">{user.email}</p></div>
        </section>
        <Link href="/profile/settings" className="flex items-center justify-between rounded-2xl border bg-white p-4 font-semibold dark:bg-neutral-950"><span className="inline-flex items-center gap-2"><Settings className="h-5 w-5" /> Edit profile</span><span>›</span></Link>
      </PageContainer>
    </>
  );
}
