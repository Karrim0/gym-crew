import { DashboardHeader } from "@/components/layout/DashboardHeader";

export default async function WorkoutSessionPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;
  return <DashboardHeader title={`Workout ${sessionId.slice(0, 8)}`} showBackButton />;
}
