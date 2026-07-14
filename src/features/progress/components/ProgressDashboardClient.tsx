"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Award, BarChart3, ChevronRight, Clock3, Dumbbell, Flame, Target } from "lucide-react";
import { formatDuration, formatWeight } from "@/lib/utils/format";
import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";
import type { UUID } from "@/types";
import {
  fetchPersonalProgressSummary,
  type PersonalProgressSummary,
} from "../services/progress.service";

interface ProgressDashboardClientProps {
  userId: UUID;
}

function StatCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-center justify-between text-neutral-500">
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
        {icon}
      </div>
      <p className="mt-3 text-2xl font-bold">{value}</p>
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

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>;
  if (!summary) return <p className="py-12 text-center text-sm text-neutral-500">Calculating your progress…</p>;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-sm opacity-70">Your training, independent of any group</p>
        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold">{summary.sessionsThisWeek} sessions</h2>
            <p className="mt-1 text-sm opacity-70">this training week</p>
          </div>
          <Dumbbell className="h-10 w-10 opacity-50" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Weekly adherence"
          value={formatAdherencePercentage(summary.adherence.weekly)}
          detail={`${summary.adherence.weeklyCompleted}/${summary.adherence.weeklyScheduled} planned sessions`}
          icon={<Target className="h-4 w-4" />}
        />
        <StatCard
          label="Current streak"
          value={`${summary.currentStreak} wk`}
          detail={`Longest: ${summary.longestStreak} weeks`}
          icon={<Flame className="h-4 w-4" />}
        />
        <StatCard
          label="Monthly volume"
          value={formatWeight(summary.volumeThisMonthKg)}
          detail={`${summary.sessionsThisMonth} completed sessions`}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatCard
          label="Average duration"
          value={formatDuration(summary.averageDurationSeconds)}
          detail={`${summary.totalSessions} sessions tracked`}
          icon={<Clock3 className="h-4 w-4" />}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/progress/records" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/40"><Award className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-bold">Personal records</span><span className="text-sm text-neutral-500">Weight, reps and set volume</span></span>
          <ChevronRight className="h-5 w-5" />
        </Link>
        <Link href="/progress/exercises" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/40"><BarChart3 className="h-5 w-5" /></span>
          <span className="flex-1"><span className="block font-bold">Exercise progress</span><span className="text-sm text-neutral-500">Every lift across every session</span></span>
          <ChevronRight className="h-5 w-5" />
        </Link>
      </div>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <div className="flex items-center justify-between gap-3">
          <div><h3 className="font-bold">Recent records</h3><p className="text-sm text-neutral-500">Calculated from your personal workout history</p></div>
          <Link href="/progress/records" className="text-sm font-semibold">View all</Link>
        </div>
        {summary.recentRecords.length === 0 ? (
          <p className="mt-4 rounded-xl bg-neutral-50 p-4 text-sm text-neutral-500 dark:bg-neutral-900">Complete a workout with weights and reps to start building records.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {summary.recentRecords.map((record) => (
              <div key={`${record.exerciseId}-${record.type}`} className="flex items-center gap-3">
                <Award className="h-4 w-4 text-amber-500" />
                <div className="min-w-0 flex-1"><p className="truncate font-medium">{record.exerciseName}</p><p className="text-xs capitalize text-neutral-500">{record.type.replaceAll("_", " ")}</p></div>
                <strong>{record.type === "max_reps" ? `${record.value} reps` : formatWeight(record.value)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
        <h3 className="font-bold">Muscle training summary</h3>
        <p className="text-sm text-neutral-500">Based on completed working sets, not the group split.</p>
        <div className="mt-4 space-y-3">
          {summary.muscles.slice(0, 8).map((item) => {
            const maxSets = Math.max(1, ...summary.muscles.map((muscle) => muscle.completedSets));
            return (
              <div key={item.muscle}>
                <div className="mb-1 flex justify-between text-sm"><span className="capitalize">{item.muscle}</span><span className="text-neutral-500">{item.completedSets} sets</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800"><div className="h-full rounded-full bg-neutral-900 dark:bg-white" style={{ width: `${Math.max(4, (item.completedSets / maxSets) * 100)}%` }} /></div>
              </div>
            );
          })}
          {summary.muscles.length === 0 ? <p className="text-sm text-neutral-500">No completed working sets yet.</p> : null}
        </div>
      </section>
    </div>
  );
}
