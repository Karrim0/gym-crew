import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default async function ExerciseProgressPage({
  params,
}: {
  params: Promise<{ exerciseId: string }>;
}) {
  const { exerciseId } = await params;
  return <DashboardHeader title={`Exercise ${exerciseId.slice(0, 8)}`} showBackButton />;
}
