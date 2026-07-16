import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { ExerciseProgressListClient } from "@/features/progress/components/ExerciseProgressListClient";

export default async function ExerciseProgressListPage() {
  const user = await requireCurrentUser();
  return (
    <>
      <DashboardHeader title="تقدم التمارين" showBackButton />
      <PageContainer className="pb-8"><ExerciseProgressListClient userId={user.id} /></PageContainer>
    </>
  );
}
