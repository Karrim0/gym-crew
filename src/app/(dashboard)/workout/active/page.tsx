import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { Stopwatch } from "@/features/workouts/components/Stopwatch";
import { FinishWorkoutButton } from "@/features/workouts/components/FinishWorkoutButton";

export default function ActiveWorkoutPage() {
  return (
    <>
      <DashboardHeader title="Active workout" showBackButton />
      <PageContainer>
        <div className="flex flex-col gap-4">
          <Stopwatch />
          <FinishWorkoutButton disabled />
        </div>
      </PageContainer>
    </>
  );
}
