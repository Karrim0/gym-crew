import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { GroupMembersClient } from "@/features/groups/components/GroupMembersClient";

export default async function GroupMembersPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership) return null;
  return (
    <>
      <DashboardHeader title="Members" showBackButton />
      <PageContainer className="pb-8"><GroupMembersClient groupId={membership.groupId} currentUserId={user.id} currentRole={membership.role} /></PageContainer>
    </>
  );
}
