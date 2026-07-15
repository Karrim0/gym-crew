import { Suspense } from "react";
import { PageContainer } from "@/components/layout/PageContainer";
import { ActiveWorkoutClient } from "@/features/workouts/components/ActiveWorkoutClient";

export default function ActiveWorkoutPage() {
  return (
    <PageContainer className="pb-8"><Suspense fallback={<p className="py-10 text-center text-sm text-neutral-500">Loading workout…</p>}><ActiveWorkoutClient /></Suspense></PageContainer>
  );
}
