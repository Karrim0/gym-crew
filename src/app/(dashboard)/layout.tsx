import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);

  if (!membership) {
    redirect("/onboarding");
  }

  return <AppShell>{children}</AppShell>;
}
