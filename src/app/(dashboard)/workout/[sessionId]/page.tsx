import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { WorkoutDetailsClient } from "@/features/workouts/components/WorkoutDetailsClient";

export default async function WorkoutSessionPage({ params }: { params: Promise<{ sessionId: string }> }) {
  const { sessionId } = await params;
  return (
    <>
      <DashboardHeader title="Workout details" showBackButton />
      <PageContainer className="pb-8"><WorkoutDetailsClient sessionId={sessionId} /></PageContainer>
    </>
  );
}
