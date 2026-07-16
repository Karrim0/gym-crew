import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { requireCurrentUser } from "@/features/auth/services/auth.server";
import { ExerciseProgressDetailsClient } from "@/features/progress/components/ExerciseProgressDetailsClient";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const user = await requireCurrentUser();
  const { exerciseId } = await params;
  return (
    <>
      <DashboardHeader title="تفاصيل التمرين" showBackButton />
      <PageContainer className="pb-8"><ExerciseProgressDetailsClient userId={user.id} exerciseId={exerciseId} /></PageContainer>
    </>
  );
}
