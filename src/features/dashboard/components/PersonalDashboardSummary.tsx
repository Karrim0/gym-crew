"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, ArrowUpRight, Flame, Target } from "lucide-react";
import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";
import { fetchPersonalProgressSummary, type PersonalProgressSummary } from "@/features/progress/services/progress.service";
import type { UUID } from "@/types";

export function PersonalDashboardSummary({ userId }: { userId: UUID }) {
  const [summary, setSummary] = useState<PersonalProgressSummary | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPersonalProgressSummary(userId)
      .then((next) => { if (active) setSummary(next); })
      .catch(() => { if (active) setSummary(null); });
    return () => { active = false; };
  }, [userId]);

  if (!summary) {
    return <div className="h-40 animate-pulse rounded-[26px] border border-white/[0.06] bg-white/[0.035]" />;
  }

  const stats = [
    { label: "Weekly plan", value: formatAdherencePercentage(summary.adherence.weekly), detail: `${summary.adherence.weeklyCompleted}/${summary.adherence.weeklyScheduled} sessions`, icon: Target, tone: "text-indigo-300" },
    { label: "Current streak", value: `${summary.currentStreak} wk`, detail: `Best ${summary.longestStreak} weeks`, icon: Flame, tone: "text-orange-400" },
    { label: "Recent PRs", value: String(summary.recentRecords.length), detail: "new milestones", icon: Award, tone: "text-amber-300" },
  ];

  return (
    <section className="gc-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="gc-eyebrow">Personal momentum</p>
          <h2 className="mt-1 text-xl font-bold">Your week at a glance</h2>
        </div>
        <Link href="/progress" className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-neutral-300" aria-label="Open progress">
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ label, value, detail, icon: Icon, tone }) => (
          <div key={label} className="gc-stat min-w-0">
            <Icon className={`h-4 w-4 ${tone}`} />
            <strong className="mt-2 block truncate text-lg font-bold sm:text-2xl">{value}</strong>
            <span className="mt-1 block truncate text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-500 sm:text-[11px]">{label}</span>
            <span className="mt-0.5 hidden text-xs text-neutral-600 sm:block">{detail}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
