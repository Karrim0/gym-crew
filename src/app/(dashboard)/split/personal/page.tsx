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
      <DashboardHeader title="My split" showBackButton />
      <PageContainer className="pb-8"><SplitManager mode="personal" groupId={membership.groupId} userId={user.id} role={membership.role} /></PageContainer>
    </>
  );
}
