import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { GroupOverviewClient } from "@/features/groups/components/GroupOverviewClient";

export default async function GroupPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership) return null;

  return (
    <>
      <DashboardHeader title="الجروب" />
      <PageContainer><GroupOverviewClient group={membership.group} role={membership.role} currentUserId={user.id} /></PageContainer>
    </>
  );
}
