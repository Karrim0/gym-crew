import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";
import { GroupActivityFeedClient } from "@/features/groups/components/GroupActivityFeedClient";
import { WeeklyLeaderboard } from "@/features/groups/components/WeeklyLeaderboard";

export default async function GroupActivityPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);
  if (!membership || membership.group.isPersonal) return null;
  return (
    <>
      <DashboardHeader title="نشاط الجروب" showBackButton />
      <PageContainer className="space-y-5 pb-24 pt-5">
        <WeeklyLeaderboard groupId={membership.groupId} />
        <section><div className="mb-3"><h2 className="text-xl font-bold">آخر أخبار الجروب</h2><p className="text-sm text-neutral-500">بنظهر بس الملخصات اللي كل عضو اختار يشاركها.</p></div><GroupActivityFeedClient groupId={membership.groupId} /></section>
      </PageContainer>
    </>
  );
}
