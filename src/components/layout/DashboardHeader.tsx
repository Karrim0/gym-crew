import type { ReactNode } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { SyncStatusIndicator } from "@/components/feedback/SyncStatusIndicator";
import { ProfileAvatarLink } from "@/components/layout/ProfileAvatarLink";
import { LanguageSwitcher } from "@/components/localization/LanguageSwitcher";
import { getCurrentUser } from "@/features/auth/services/auth.server";
import { createClient } from "@/lib/supabase/server";

export interface DashboardHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: ReactNode;
  showProfile?: boolean;
}

interface HeaderProfile {
  avatarUrl: string | null;
  displayName: string;
}

async function getHeaderProfile(): Promise<HeaderProfile> {
  const user = await getCurrentUser();
  const fallbackName = user?.email?.split("@")[0] ?? "لاعب";

  if (!user) {
    return { avatarUrl: null, displayName: fallbackName };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("display_name, avatar_url")
    .eq("id", user.id)
    .maybeSingle();

  return {
    avatarUrl: data?.avatar_url ?? null,
    displayName: data?.display_name?.trim() || fallbackName,
  };
}

export async function DashboardHeader({ title, showBackButton, actions, showProfile = true }: DashboardHeaderProps) {
  const profile = showProfile ? await getHeaderProfile() : null;

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-[#0b0d13]/90 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {showBackButton ? <BackButton /> : null}
          <h1 className="truncate text-lg font-bold tracking-[-0.015em] text-white sm:text-xl">{title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          <LanguageSwitcher />
          <SyncStatusIndicator />
          {profile ? <ProfileAvatarLink avatarUrl={profile.avatarUrl} displayName={profile.displayName} /> : null}
        </div>
      </div>
    </header>
  );
}
