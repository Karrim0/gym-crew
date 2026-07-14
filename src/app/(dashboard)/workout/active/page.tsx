import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActiveWorkoutClient } from "@/features/workouts/components/ActiveWorkoutClient";

export default function ActiveWorkoutPage() {
  return (
    <>
      <DashboardHeader title="Active workout" showBackButton />
      <PageContainer className="pb-8"><Suspense fallback={<p className="py-10 text-center text-sm text-neutral-500">Loading workout…</p>}><ActiveWorkoutClient /></Suspense></PageContainer>
    </>
  );
}
