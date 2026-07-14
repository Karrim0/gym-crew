import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { GroupPrivacySettingsClient } from "@/features/groups/components/GroupPrivacySettingsClient";

export default async function GroupSettingsPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership || membership.group.isPersonal) return null;
  return (
    <>
      <DashboardHeader title="Group settings" showBackButton />
      <PageContainer className="pb-24"><GroupPrivacySettingsClient userId={user.id} /></PageContainer>
    </>
  );
}
