import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { TodaysWorkoutClient } from "@/features/workouts/components/TodaysWorkoutClient";

export default async function TodaysWorkoutPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="تمرينة النهارده" />
      <PageContainer className="pb-8"><TodaysWorkoutClient userId={user.id} /></PageContainer>
    </>
  );
}
