"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { Activity, ArrowRight, CalendarDays, Dumbbell, Flame, Heart, Moon, PencilLine, Shield, Target, Zap } from "lucide-react";
import { fetchEffectiveWeekSchedule } from "@/features/splits/services/split.service";
import type { WeeklyScheduleDayWithDetails } from "@/features/splits/types";
import { getWeekdayFromDate, parseISODateOnly } from "@/lib/dates";
import type { SplitDayIconKey, UUID, Weekday } from "@/types";

const SHORT_DAY: Record<Weekday, string> = {
  saturday: "Sat", sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri",
};

const ICONS: Record<SplitDayIconKey, typeof Dumbbell> = {
  dumbbell: Dumbbell, zap: Zap, target: Target, flame: Flame, shield: Shield, heart: Heart, moon: Moon, activity: Activity,
};

function subscribeToDate() { return () => undefined; }
function getBrowserDate() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}
function getServerDate(): null { return null; }

export function PersonalSplitOverviewClient({ userId }: { userId: UUID }) {
  const [days, setDays] = useState<WeeklyScheduleDayWithDetails[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const today = useSyncExternalStore(subscribeToDate, getBrowserDate, getServerDate);

  useEffect(() => {
    if (!today) return;
    let active = true;
    void fetchEffectiveWeekSchedule(userId, today)
      .then((result) => { if (active) { setDays(result); setStatus("ready"); } })
      .catch(() => { if (active) setStatus("error"); });
    return () => { active = false; };
  }, [today, userId]);

  const orderedDays = useMemo(() => [...days].sort((a, b) => a.scheduleDate.localeCompare(b.scheduleDate)), [days]);

  if (status === "loading") return <div className="h-44 animate-pulse rounded-[22px] border border-white/[0.06] bg-white/[0.035]" />;
  if (status === "error") return <section className="gc-card p-5"><p className="gc-eyebrow">Your split</p><h2 className="mt-1 text-xl font-bold">Your plan could not be loaded.</h2><p className="mt-2 text-sm text-neutral-500">Open My split to retry or update this week.</p><Link href="/split/personal" className="gc-secondary-button mt-4">Open My split <ArrowRight className="h-4 w-4" /></Link></section>;

  return (
    <section className="gc-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div><p className="gc-eyebrow">Your split</p><h2 className="mt-1 text-xl font-bold">This training week</h2><p className="mt-1 text-sm text-neutral-500">Your custom names and this week&apos;s changes are shown here.</p></div>
        <Link href="/split/personal" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-indigo-200" aria-label="Edit personal split"><PencilLine className="h-4 w-4" /></Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Weekly split summary">
        {orderedDays.map((day) => {
          const weekday = getWeekdayFromDate(parseISODateOnly(day.scheduleDate));
          const active = day.scheduleDate === today;
          const Icon = ICONS[day.iconKey];
          return (
            <Link key={day.scheduleDate} href={`/split/personal?day=${weekday}`} className={`min-w-0 rounded-xl border px-1 py-2 text-center transition ${active ? "border-indigo-300/50 bg-indigo-300/14" : "border-white/[0.06] bg-white/[0.025]"}`} aria-current={active ? "date" : undefined}>
              <span className={`block text-[9px] font-bold uppercase tracking-wide ${active ? "text-indigo-200" : "text-neutral-500"}`}>{SHORT_DAY[weekday]}</span>
              <Icon className={`mx-auto mt-1 h-3.5 w-3.5 ${day.workoutType === "rest" ? "text-neutral-600" : active ? "text-indigo-200" : "text-neutral-400"}`} />
              <span className={`mt-1 block truncate text-[9px] font-semibold sm:text-[10px] ${day.workoutType === "rest" ? "text-neutral-500" : "text-neutral-200"}`}>{day.displayName}</span>
              {active ? <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-indigo-300" /> : null}
            </Link>
          );
        })}
      </div>

      <Link href="/split/personal" className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition hover:border-indigo-300/25">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><CalendarDays className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Move or customize a day</span><span className="block text-xs text-neutral-500">This week only or every week</span></span><ArrowRight className="h-4 w-4 text-neutral-500" />
      </Link>
    </section>
  );
}
