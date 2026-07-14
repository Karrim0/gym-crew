import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { LogoutButton } from "@/features/auth/components/LogoutButton";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { GroupInviteCode } from "@/features/groups/components/GroupInviteCode";
import { getGroupMembershipForUser } from "@/features/groups/services/group.server";

export default async function DashboardPage() {
  const user = await requireCurrentUser();
  const membership = await getGroupMembershipForUser(user.id);

  return (
    <>
      <DashboardHeader title="Dashboard" actions={<LogoutButton />} />
      <PageContainer className="space-y-4">
        <section className="rounded-md border p-4">
          <p className="text-sm opacity-70">Signed in as</p>
          <p className="font-medium">{user.email ?? "Gym Crew member"}</p>
        </section>

        {membership ? (
          <section className="space-y-3 rounded-md border p-4">
            <div>
              <p className="text-sm opacity-70">Your group</p>
              <h2 className="text-lg font-semibold">{membership.group.name}</h2>
              <p className="text-sm capitalize opacity-70">Role: {membership.role}</p>
            </div>
            <div>
              <p className="mb-2 text-sm opacity-70">Invite code</p>
              <GroupInviteCode inviteCode={membership.group.inviteCode} />
            </div>
          </section>
        ) : null}

        <p className="text-sm opacity-70">
          Today&apos;s workout, adherence, and group activity will be implemented in the next phase.
        </p>
      </PageContainer>
    </>
  );
}
