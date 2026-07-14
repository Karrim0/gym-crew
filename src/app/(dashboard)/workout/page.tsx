import Link from "next/link";
import { CalendarDays, ChevronRight, Dumbbell, History } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function WorkoutPage() {
  return (
    <>
      <DashboardHeader title="Workout" />
      <PageContainer className="grid gap-3 pb-8">
        <Link href="/workout/today" className="flex items-center gap-3 rounded-2xl bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950"><Dumbbell className="h-6 w-6" /><span className="flex-1"><span className="block text-lg font-bold">Today&apos;s workout</span><span className="text-sm opacity-70">Start or continue your session</span></span><ChevronRight className="h-5 w-5" /></Link>
        <Link href="/workout/history" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950"><History className="h-5 w-5" /><span className="flex-1"><span className="block font-bold">Workout history</span><span className="text-sm text-neutral-500">Review previous sets and notes</span></span><ChevronRight className="h-5 w-5" /></Link>
        <div className="flex items-center gap-3 rounded-2xl border bg-white p-4 opacity-60 dark:bg-neutral-950"><CalendarDays className="h-5 w-5" /><span><span className="block font-bold">Calendar</span><span className="text-sm text-neutral-500">Coming with progress tracking</span></span></div>
      </PageContainer>
    </>
  );
}
