import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { SplitManager } from "@/features/splits/components/SplitManager";

export default async function GroupSplitPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership) return null;
  return (
    <>
      <DashboardHeader title="جدول الجروب" showBackButton />
      <PageContainer className="pb-8"><SplitManager mode="group" groupId={membership.groupId} userId={user.id} role={membership.role} /></PageContainer>
    </>
  );
}
