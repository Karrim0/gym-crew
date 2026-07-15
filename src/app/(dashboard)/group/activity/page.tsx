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
      <DashboardHeader title="Crew activity" showBackButton />
      <PageContainer className="space-y-5 pb-24 pt-5">
        <WeeklyLeaderboard groupId={membership.groupId} />
        <section><div className="mb-3"><h2 className="text-xl font-bold">Latest from the crew</h2><p className="text-sm text-neutral-500">Only the summaries each member chose to share.</p></div><GroupActivityFeedClient groupId={membership.groupId} /></section>
      </PageContainer>
    </>
  );
}
