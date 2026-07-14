"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Award, BarChart3, ChevronRight, Clock3, Dumbbell, Flame, ScanLine, Target } from "lucide-react";
import { formatDuration, formatWeight } from "@/lib/utils/format";
import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";
import type { UUID } from "@/types";
import {
  fetchPersonalProgressSummary,
  type PersonalProgressSummary,
} from "../services/progress.service";
import { TrainingTrendChart } from "./TrainingTrendChart";

interface ProgressDashboardClientProps { userId: UUID }

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-center justify-between text-neutral-500"><span className="text-xs font-semibold uppercase tracking-wide">{label}</span>{icon}</div>
      <p className="mt-3 text-2xl font-black">{value}</p>
      <p className="mt-1 text-xs text-neutral-500">{detail}</p>
    </div>
  );
}

export function ProgressDashboardClient({ userId }: ProgressDashboardClientProps) {
  const [summary, setSummary] = useState<PersonalProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPersonalProgressSummary(userId)
      .then(setSummary)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load progress."));
  }, [userId]);

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p>;
  if (!summary) return <div className="space-y-3"><div className="h-36 animate-pulse rounded-[28px] bg-neutral-200 dark:bg-neutral-800" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" />)}</div></div>;

  const topMuscle = summary.muscles[0];

  return (
    <div className="space-y-5 pb-24">
      <section className="rounded-[30px] bg-neutral-950 p-5 text-white shadow-sm dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-65">Your training, independent of any group</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div><h2 className="text-3xl font-black">{summary.sessionsThisWeek} sessions</h2><p className="mt-1 text-sm opacity-65">this training week</p></div>
          <Dumbbell className="h-11 w-11 opacity-45" />
        </div>
        {topMuscle ? <p className="mt-4 rounded-2xl bg-white/10 px-3 py-2 text-sm dark:bg-black/10">Most trained lately: <strong className="capitalize">{topMuscle.muscle}</strong></p> : null}
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Weekly adherence" value={formatAdherencePercentage(summary.adherence.weekly)} detail={`${summary.adherence.weeklyCompleted}/${summary.adherence.weeklyScheduled} planned sessions`} icon={<Target className="h-4 w-4" />} />
        <StatCard label="Current streak" value={`${summary.currentStreak} wk`} detail={`Longest: ${summary.longestStreak} weeks`} icon={<Flame className="h-4 w-4" />} />
        <StatCard label="Monthly volume" value={formatWeight(summary.volumeThisMonthKg)} detail={`${summary.sessionsThisMonth} completed sessions`} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="Average duration" value={formatDuration(summary.averageDurationSeconds)} detail={`${summary.totalSessions} sessions tracked`} icon={<Clock3 className="h-4 w-4" />} />
      </div>

      <TrainingTrendChart userId={userId} />

      <div className="grid gap-3 sm:grid-cols-3">
        <Link href="/progress/body-map" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40"><ScanLine className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-black">Body map</span><span className="text-sm text-neutral-500">Muscles by sets or volume</span></span><ChevronRight className="h-5 w-5" />
        </Link>
        <Link href="/progress/records" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40"><Award className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-black">Personal records</span><span className="text-sm text-neutral-500">Weight, reps and set volume</span></span><ChevronRight className="h-5 w-5" />
        </Link>
        <Link href="/progress/exercises" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40"><BarChart3 className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-black">Exercise progress</span><span className="text-sm text-neutral-500">Every lift across sessions</span></span><ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <section className="rounded-[26px] border bg-white p-4 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3"><div><h3 className="font-black">Recent records</h3><p className="text-sm text-neutral-500">Calculated from your personal history</p></div><Link href="/progress/records" className="text-sm font-bold">View all</Link></div>
        {summary.recentRecords.length === 0 ? <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-900">Complete a workout with weights and reps to start building records.</p> : (
          <div className="mt-4 space-y-3">{summary.recentRecords.map((record) => <div key={`${record.exerciseId}-${record.type}`} className="flex items-center gap-3"><Award className="h-4 w-4 text-amber-500" /><div className="min-w-0 flex-1"><p className="truncate font-semibold">{record.exerciseName}</p><p className="text-xs capitalize text-neutral-500">{record.type.replaceAll("_", " ")}</p></div><strong>{record.type === "max_reps" ? `${record.value} reps` : formatWeight(record.value)}</strong></div>)}</div>
        )}
      </section>
    </div>
  );
}
