"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Award, ChevronRight, Flame, Target } from "lucide-react";
import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";
import { fetchPersonalProgressSummary, type PersonalProgressSummary } from "@/features/progress/services/progress.service";
import type { UUID } from "@/types";

export function PersonalDashboardSummary({ userId }: { userId: UUID }) {
  const [summary, setSummary] = useState<PersonalProgressSummary | null>(null);

  useEffect(() => {
    fetchPersonalProgressSummary(userId).then(setSummary).catch(() => setSummary(null));
  }, [userId]);

  if (!summary) return null;

  return (
    <section className="rounded-2xl border bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="font-bold">Your progress</h2><p className="text-sm text-neutral-500">Personal stats from your own sessions</p></div>
        <Link href="/progress" className="inline-flex items-center gap-1 text-sm font-semibold">Details <ChevronRight className="h-4 w-4" /></Link>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"><Target className="mx-auto h-4 w-4 text-neutral-500" /><strong className="mt-1 block">{formatAdherencePercentage(summary.adherence.weekly)}</strong><span className="text-[11px] text-neutral-500">week</span></div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"><Flame className="mx-auto h-4 w-4 text-orange-500" /><strong className="mt-1 block">{summary.currentStreak}</strong><span className="text-[11px] text-neutral-500">week streak</span></div>
        <div className="rounded-xl bg-neutral-50 p-3 dark:bg-neutral-900"><Award className="mx-auto h-4 w-4 text-amber-500" /><strong className="mt-1 block">{summary.recentRecords.length}</strong><span className="text-[11px] text-neutral-500">recent PRs</span></div>
      </div>
    </section>
  );
}
