import Link from "next/link";
import { ArrowUpRight, CalendarDays, Clock3, Dumbbell, History, ListChecks } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function WorkoutPage() {
  return (
    <>
      <DashboardHeader title="Workout" />
      <PageContainer className="space-y-4 pb-8 pt-5">
        <Link
          href="/workout/today"
          className="relative block overflow-hidden rounded-[30px] border border-lime-300/15 bg-[linear-gradient(135deg,rgba(183,255,60,.18),rgba(14,18,15,.96)_52%,rgba(7,9,7,.98))] p-5 sm:p-7"
        >
          <div className="absolute -right-10 -top-12 h-40 w-40 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="relative flex items-start gap-4">
            <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[20px] bg-lime-300 text-neutral-950">
              <Dumbbell className="h-7 w-7" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="gc-eyebrow">Gym mode</span>
              <span className="mt-1 block text-2xl font-black tracking-[-0.035em] sm:text-3xl">Today&apos;s workout</span>
              <span className="mt-2 block max-w-xl text-sm leading-6 text-neutral-400">Open your plan, log sets with one hand and keep your rest timer running across the app.</span>
            </span>
            <ArrowUpRight className="h-5 w-5 text-lime-300" />
          </div>
        </Link>

        <div className="grid gap-3 sm:grid-cols-2">
          <Link href="/workout/active" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300/10 text-lime-300"><Clock3 className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Active session</span><span className="block text-sm text-neutral-500">Continue what you started</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/workout/history" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><History className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Workout history</span><span className="block text-sm text-neutral-500">Review sets and notes</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <Link href="/split/personal" className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-300"><ListChecks className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-black">Personal split</span><span className="block text-sm text-neutral-500">Exercises and rest days</span></span>
            <ArrowUpRight className="h-4 w-4 text-neutral-600" />
          </Link>
          <div className="gc-card flex items-center gap-3 p-4 opacity-60">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/[0.05] text-neutral-400"><CalendarDays className="h-5 w-5" /></span>
            <span><span className="block font-black">Training calendar</span><span className="block text-sm text-neutral-500">Coming after v1 launch</span></span>
          </div>
        </div>
      </PageContainer>
    </>
  );
}
