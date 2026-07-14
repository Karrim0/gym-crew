import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/layout/AuthShell";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);

  if (membership) {
    redirect("/dashboard");
  }

  return <AuthShell>{children}</AuthShell>;
}
