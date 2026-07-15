"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ArrowRight, CalendarDays, PencilLine } from "lucide-react";
import { WEEKDAYS_STARTING_SATURDAY } from "@/constants/schedule";
import { fetchPersonalSplit } from "@/features/splits/services/split.service";
import type { SplitDayWithDetails } from "@/features/splits/types";
import type { UUID, Weekday } from "@/types";

const DAY_BY_JS_INDEX: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const SHORT_DAY: Record<Weekday, string> = {
  saturday: "Sat",
  sunday: "Sun",
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
};

function subscribeToDate() {
  return () => undefined;
}

function getBrowserWeekday(): Weekday {
  return DAY_BY_JS_INDEX[new Date().getDay()];
}

function getServerWeekday(): null {
  return null;
}

function dayName(day: SplitDayWithDetails | undefined) {
  if (!day || day.workoutType === "rest") return "Rest";
  if (day.displayName) return day.displayName;
  return day.workoutType.charAt(0).toUpperCase() + day.workoutType.slice(1);
}

export function PersonalSplitOverviewClient({ userId }: { userId: UUID }) {
  const [days, setDays] = useState<SplitDayWithDetails[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const today = useSyncExternalStore(subscribeToDate, getBrowserWeekday, getServerWeekday);

  useEffect(() => {
    let active = true;
    void fetchPersonalSplit(userId)
      .then((result) => {
        if (!active) return;
        setDays(result);
        setStatus("ready");
      })
      .catch(() => {
        if (active) setStatus("error");
      });
    return () => {
      active = false;
    };
  }, [userId]);

  const orderedDays = useMemo(
    () => WEEKDAYS_STARTING_SATURDAY.map((weekday) => days.find((day) => day.weekday === weekday)),
    [days],
  );

  if (status === "loading") {
    return <div className="h-44 animate-pulse rounded-[22px] border border-white/[0.06] bg-white/[0.035]" />;
  }

  if (status === "error") {
    return (
      <section className="gc-card p-5">
        <p className="gc-eyebrow">Your split</p>
        <h2 className="mt-1 text-xl font-bold">Your plan could not be loaded.</h2>
        <p className="mt-2 text-sm text-neutral-500">Open My split to retry or update your training week.</p>
        <Link href="/split/personal" className="gc-secondary-button mt-4">Open My split <ArrowRight className="h-4 w-4" /></Link>
      </section>
    );
  }

  return (
    <section className="gc-card p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="gc-eyebrow">Your split</p>
          <h2 className="mt-1 text-xl font-bold">Your training week</h2>
          <p className="mt-1 text-sm text-neutral-500">Tap any day in My split to change its workout, exercises or targets.</p>
        </div>
        <Link href="/split/personal" className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/[0.08] bg-white/[0.04] text-indigo-200" aria-label="Edit personal split">
          <PencilLine className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5" aria-label="Weekly split summary">
        {orderedDays.map((day, index) => {
          const weekday = WEEKDAYS_STARTING_SATURDAY[index];
          const active = weekday === today;
          const rest = !day || day.workoutType === "rest";
          return (
            <Link
              key={weekday}
              href={`/split/personal?day=${weekday}`}
              className={`min-w-0 rounded-xl border px-1 py-2.5 text-center transition ${active ? "border-indigo-300/50 bg-indigo-300/14" : "border-white/[0.06] bg-white/[0.025]"}`}
              aria-current={active ? "date" : undefined}
            >
              <span className={`block text-[10px] font-bold uppercase tracking-wide ${active ? "text-indigo-200" : "text-neutral-500"}`}>{SHORT_DAY[weekday]}</span>
              <span className={`mt-1 block truncate text-[10px] font-semibold sm:text-xs ${rest ? "text-neutral-500" : "text-neutral-200"}`}>{dayName(day)}</span>
              {active ? <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-indigo-300" /> : null}
            </Link>
          );
        })}
      </div>

      <Link href="/split/personal" className="mt-4 flex items-center gap-3 rounded-xl border border-white/[0.07] bg-white/[0.025] p-3.5 transition hover:border-indigo-300/25">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-300/10 text-indigo-200"><CalendarDays className="h-4 w-4" /></span>
        <span className="min-w-0 flex-1"><span className="block text-sm font-bold">Open the split editor</span><span className="block text-xs text-neutral-500">Choose training and rest days freely</span></span>
        <ArrowRight className="h-4 w-4 text-neutral-500" />
      </Link>
    </section>
  );
}
