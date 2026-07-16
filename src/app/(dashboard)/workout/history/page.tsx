import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { WorkoutHistoryClient } from "@/features/workouts/components/WorkoutHistoryClient";

export default async function WorkoutHistoryPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="سجل التمارين" showBackButton />
      <PageContainer className="pb-8"><WorkoutHistoryClient userId={user.id} /></PageContainer>
    </>
  );
}
