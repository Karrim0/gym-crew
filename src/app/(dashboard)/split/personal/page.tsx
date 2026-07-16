import { Suspense } from "react";
import { redirect } from "next/navigation";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { SplitManager } from "@/features/splits/components/SplitManager";

export default async function PersonalSplitPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership) redirect("/onboarding");
  return (
    <>
      <DashboardHeader title="جدولي" />
      <PageContainer className="pb-8">
        <Suspense fallback={<div className="mt-4 h-72 animate-pulse rounded-[24px] border border-white/[0.06] bg-white/[0.035]" />}>
          <SplitManager mode="personal" groupId={membership.groupId} userId={user.id} role={membership.role} />
        </Suspense>
      </PageContainer>
    </>
  );
}
