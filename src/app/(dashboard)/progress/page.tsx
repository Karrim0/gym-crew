import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { ProgressDashboardClient } from "@/features/progress/components/ProgressDashboardClient";

export default async function ProgressPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="My progress" />
      <PageContainer className="pb-8"><ProgressDashboardClient userId={user.id} /></PageContainer>
    </>
  );
}
