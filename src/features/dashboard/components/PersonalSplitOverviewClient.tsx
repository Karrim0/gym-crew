"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronRight, PencilLine } from "lucide-react";
import type { UUID, Weekday } from "@/types";
import type { SplitDayWithDetails } from "@/features/splits/types";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";

const WEEKDAYS: Weekday[] = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const SHORT_DAY: Record<Weekday, string> = {
  saturday: "Sat",
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};
const DAY_BY_JS_INDEX: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function dayTitle(day: SplitDayWithDetails | undefined): string {
  if (!day || day.workoutType === "rest") return "Rest";
  return day.displayName?.trim() || `${day.workoutType.charAt(0).toUpperCase()}${day.workoutType.slice(1)}`;
}

export function PersonalSplitOverviewClient({ userId }: { userId: UUID }) {
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [today, setToday] = useState<Weekday | null>(null);

  useEffect(() => {
    setToday(DAY_BY_JS_INDEX[new Date().getDay()]);

    let active = true;
    fetchPersonalSplit(userId)
      .then((result) => { if (active) setDays(result); })
      .catch((caught) => { if (active) setError(caught instanceof Error ? caught.message : "Unable to load your split."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const byWeekday = useMemo(() => new Map(days.map((day) => [day.weekday, day])), [days]);

  return (
    <section className="gc-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="gc-eyebrow">Priority 1 · Your plan</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.02em]">Personal split</h2>
          <p className="mt-1 text-sm text-neutral-500">Your week at a glance. Edit days, exercises, sets and rest days anytime.</p>
        </div>
        <Link href="/split/personal" className="gc-secondary-button shrink-0 px-3">
          <PencilLine className="h-4 w-4" /> <span className="hidden sm:inline">Edit plan</span>
        </Link>
      </div>

      {loading ? (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">{Array.from({ length: 7 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-white/[0.035]" />)}</div>
      ) : error ? (
        <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p>
      ) : (
        <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-7">
          {WEEKDAYS.map((weekday) => {
            const day = byWeekday.get(weekday);
            const isToday = today !== null && weekday === today;
            const isRest = !day || day.workoutType === "rest";
            return (
              <Link
                key={weekday}
                href="/split/personal"
                className={`min-h-24 rounded-xl border p-2.5 transition ${isToday ? "border-indigo-300/40 bg-indigo-300/10" : "border-white/[0.06] bg-white/[0.025] hover:border-white/15"}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-[11px] font-bold ${isToday ? "text-indigo-200" : "text-neutral-500"}`}>{SHORT_DAY[weekday]}</span>
                  {isToday ? <span className="h-1.5 w-1.5 rounded-full bg-indigo-300" /> : null}
                </div>
                <p className="mt-3 line-clamp-2 text-sm font-semibold leading-4">{dayTitle(day)}</p>
                <p className="mt-1 text-[10px] text-neutral-500">{isRest ? "Recovery" : `${day?.exercises.length ?? 0} exercises`}</p>
              </Link>
            );
          })}
        </div>
      )}

      <Link href="/split/personal" className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-sm font-semibold text-neutral-300">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-300/10 text-indigo-200"><CalendarDays className="h-4 w-4" /></span>
        <span className="flex-1">Open the full split editor</span>
        <ChevronRight className="h-4 w-4 text-neutral-600" />
      </Link>
    </section>
  );
}
