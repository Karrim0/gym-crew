/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useMemo, useState } from "react";
import type { UUID } from "@/types";
import {
  fetchMuscleAnalytics,
  type AnalyticsRangeDays,
  type MuscleAnalyticsSummary,
  type MuscleMetric,
} from "@/features/progress/services/progress.service";
import { BodyMap } from "./BodyMap";
import { MuscleActivityLegend } from "./MuscleActivityLegend";
import { MuscleSummary } from "./MuscleSummary";

const RANGES: AnalyticsRangeDays[] = [7, 30, 90];

export function BodyMapClient({ userId }: { userId: UUID }) {
  const [range, setRange] = useState<AnalyticsRangeDays>(30);
  const [metric, setMetric] = useState<MuscleMetric>("sets");
  const [muscles, setMuscles] = useState<MuscleAnalyticsSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    fetchMuscleAnalytics(userId, range)
      .then(setMuscles)
      .catch((caught) => setError(caught instanceof Error ? caught.message : "Unable to load body map."))
      .finally(() => setIsLoading(false));
  }, [range, userId]);

  const activity = useMemo(() => muscles.map((item) => ({
    muscle: item.muscle,
    intensity: metric === "sets" ? item.intensityBySets : item.intensityByVolume,
  })), [metric, muscles]);

  return (
    <div className="space-y-4 pb-24">
      <section className="rounded-[28px] bg-neutral-950 p-5 text-white dark:bg-white dark:text-neutral-950">
        <p className="text-xs font-bold uppercase tracking-[0.15em] opacity-60">Your training history</p>
        <h2 className="mt-2 text-2xl font-black">See where the work went</h2>
        <p className="mt-2 text-sm opacity-70">The map uses completed working sets, not what was merely scheduled.</p>
      </section>

      <div className="flex items-center justify-between gap-3 overflow-x-auto">
        <div className="flex rounded-xl border bg-white p-1 dark:bg-neutral-950">
          {RANGES.map((value) => (
            <button key={value} type="button" onClick={() => setRange(value)} className={`rounded-lg px-3 py-2 text-xs font-black ${range === value ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "text-neutral-500"}`}>
              {value} days
            </button>
          ))}
        </div>
        <div className="flex rounded-xl border bg-white p-1 dark:bg-neutral-950">
          {(["sets", "volume"] as MuscleMetric[]).map((value) => (
            <button key={value} type="button" onClick={() => setMetric(value)} className={`rounded-lg px-3 py-2 text-xs font-black capitalize ${metric === value ? "bg-emerald-500 text-white" : "text-neutral-500"}`}>
              {value}
            </button>
          ))}
        </div>
      </div>

      {error ? <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700 dark:bg-red-950/30 dark:text-red-300">{error}</p> : null}
      {isLoading ? <div className="h-[390px] animate-pulse rounded-[28px] bg-neutral-100 dark:bg-neutral-900" /> : <BodyMap muscleActivity={activity} />}
      <MuscleActivityLegend metricLabel={metric === "sets" ? "working sets" : "training volume"} />
      {!isLoading ? <MuscleSummary muscles={muscles} metric={metric} /> : null}
    </div>
  );
}
