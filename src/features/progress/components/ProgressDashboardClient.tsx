"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Activity, Award, ArrowUpLeft, BarChart3, Clock3, Dumbbell, Flame, ScanLine, Target } from "lucide-react";
import { muscleLabelAr, translateExerciseName } from "@/lib/localization";
import { formatDuration, formatWeight } from "@/lib/utils/format";
import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";
import type { UUID } from "@/types";
import { fetchPersonalProgressSummary, type PersonalProgressSummary } from "../services/progress.service";
import { TrainingTrendChart } from "./TrainingTrendChart";

interface ProgressDashboardClientProps { userId: UUID }

function StatCard({ label, value, detail, icon }: { label: string; value: string; detail: string; icon: React.ReactNode }) {
  return (
    <div className="gc-card p-4">
      <div className="flex items-center justify-between text-neutral-500">
        <span className="text-[10px] font-bold uppercase tracking-[0.14em]">{label}</span>
        <span className="text-indigo-300">{icon}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tracking-[-0.035em]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-neutral-500">{detail}</p>
    </div>
  );
}

export function ProgressDashboardClient({ userId }: ProgressDashboardClientProps) {
  const [summary, setSummary] = useState<PersonalProgressSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetchPersonalProgressSummary(userId)
      .then((next) => { if (active) setSummary(next); })
      .catch((caught) => { if (active) setError(getArabicErrorMessage(caught, "معرفناش نحمّل تقدمك.")); });
    return () => { active = false; };
  }, [userId]);

  if (error) return <p className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm font-semibold text-red-300">{error}</p>;
  if (!summary) return <div className="space-y-3"><div className="h-44 animate-pulse rounded-[30px] bg-white/[0.04]" /><div className="grid grid-cols-2 gap-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-2xl bg-white/[0.035]" />)}</div></div>;

  const topMuscle = summary.muscles[0];

  return (
    <div className="space-y-5 pb-24 pt-5">
      <section className="gc-hero-card relative overflow-hidden rounded-[30px] p-5 sm:p-7">
        <div className="absolute -right-12 -top-16 h-48 w-48 rounded-full bg-indigo-300/10 blur-3xl" />
        <div className="relative flex items-end justify-between gap-4">
          <div>
            <p className="gc-eyebrow">أسبوع التمرين ده</p>
            <h2 className="mt-2 text-4xl font-bold tracking-[-0.05em]">{summary.sessionsThisWeek} تمرينات</h2>
            <p className="mt-2 text-sm text-neutral-400">خلصت {formatAdherencePercentage(summary.adherence.weekly)} من جدولك الشخصي.</p>
          </div>
          <Dumbbell className="hidden h-14 w-14 text-indigo-300/35 sm:block" />
        </div>
        {topMuscle ? <p className="relative mt-5 inline-flex rounded-full border border-white/[0.07] bg-black/20 px-3 py-2 text-xs font-bold text-neutral-300">أكتر عضلة لعبتها مؤخرًا: <strong className="mr-1 text-indigo-300">{muscleLabelAr(topMuscle.muscle)}</strong></p> : null}
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="التزام الأسبوع" value={formatAdherencePercentage(summary.adherence.weekly)} detail={`${summary.adherence.weeklyCompleted}/${summary.adherence.weeklyScheduled} تمرينات متخططلها`} icon={<Target className="h-4 w-4" />} />
        <StatCard label="السلسلة الحالية" value={`${summary.currentStreak} يوم`} detail={`الأطول: ${summary.longestStreak} يوم`} icon={<Flame className="h-4 w-4" />} />
        <StatCard label="حجم تمرين الشهر" value={formatWeight(summary.volumeThisMonthKg)} detail={`${summary.sessionsThisMonth} تمرينة مكتملة`} icon={<Activity className="h-4 w-4" />} />
        <StatCard label="متوسط وقت التمرينة" value={formatDuration(summary.averageDurationSeconds)} detail={`${summary.totalSessions} تمرينة متسجلة`} icon={<Clock3 className="h-4 w-4" />} />
      </div>

      <TrainingTrendChart userId={userId} />

      <div className="grid gap-3 md:grid-cols-3">
        {[
          { href: "/progress/body-map", title: "خريطة العضلات", detail: "العضلات حسب السِتات أو الحجم", icon: ScanLine },
          { href: "/progress/records", title: "أرقامك القياسية", detail: "الوزن والعدات وحجم السِتات", icon: Award },
          { href: "/progress/exercises", title: "تقدم التمارين", detail: "كل تمرين عبر التمرينات", icon: BarChart3 },
        ].map(({ href, title, detail, icon: Icon }) => (
          <Link key={href} href={href} className="gc-card-interactive flex items-center gap-3 p-4">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-indigo-300/10 text-indigo-300"><Icon className="h-5 w-5" /></span>
            <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><span className="block text-sm text-neutral-500">{detail}</span></span>
            <ArrowUpLeft className="h-4 w-4 text-neutral-600" />
          </Link>
        ))}
      </div>

      <section className="gc-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div><p className="gc-eyebrow">إنجازات</p><h3 className="mt-1 text-lg font-bold">أرقام جديدة</h3></div>
          <Link href="/progress/records" className="text-xs font-bold text-indigo-300">شوف الكل</Link>
        </div>
        {summary.recentRecords.length === 0 ? (
          <p className="mt-4 rounded-2xl border border-dashed border-white/10 p-4 text-sm leading-6 text-neutral-500">كمّل تمرينة وسجّل الأوزان والعدات عشان تبدأ تعمل أرقام.</p>
        ) : (
          <div className="mt-4 divide-y divide-white/[0.06]">
            {summary.recentRecords.map((record) => (
              <div key={`${record.exerciseId}-${record.type}`} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/10 text-amber-300"><Award className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><p className="truncate font-bold">{translateExerciseName(record.exerciseName)}</p><p className="text-xs capitalize text-neutral-500">{record.type === "max_weight" ? "أعلى وزن" : record.type === "max_reps" ? "أعلى عدات" : "أعلى حجم تمرين"}</p></div>
                <strong className="text-sm">{record.type === "max_reps" ? `${record.value} عدة` : formatWeight(record.value)}</strong>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
