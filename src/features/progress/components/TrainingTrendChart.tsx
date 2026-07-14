"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Dumbbell, Layers3 } from "lucide-react";
import { formatWeight } from "@/lib/utils/format";
import type { UUID } from "@/types";
import { fetchTrainingTrend, type TrainingTrendPoint } from "../services/progress.service";
import { TrendLineChart } from "./TrendLineChart";

type Metric = "volume" | "sets" | "sessions";

const METRICS: Array<{ key: Metric; label: string; icon: React.ReactNode }> = [
  { key: "volume", label: "Volume", icon: <Dumbbell className="h-4 w-4" /> },
  { key: "sets", label: "Sets", icon: <Layers3 className="h-4 w-4" /> },
  { key: "sessions", label: "Sessions", icon: <Activity className="h-4 w-4" /> },
];

export function TrainingTrendChart({ userId }: { userId: UUID }) {
  const [metric, setMetric] = useState<Metric>("volume");
  const [points, setPoints] = useState<TrainingTrendPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainingTrend(userId, 8).then(setPoints).finally(() => setLoading(false));
  }, [userId]);

  const chartPoints = useMemo(() => points.map((point) => ({
    label: point.label,
    value: metric === "volume" ? point.volumeKg : metric === "sets" ? point.workingSets : point.sessions,
  })), [metric, points]);

  const format = metric === "volume" ? (value: number) => formatWeight(value) : (value: number) => Math.round(value).toString();

  return (
    <section className="rounded-[26px] border bg-white p-4 dark:bg-neutral-950">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">8-week training trend</h3>
          <p className="text-sm text-neutral-500">Your actual completed work, including offline sessions.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {METRICS.map((item) => (
          <button key={item.key} type="button" onClick={() => setMetric(item.key)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black ${metric === item.key ? "bg-neutral-950 text-white dark:bg-white dark:text-neutral-950" : "border text-neutral-500"}`}>
            {item.icon}{item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {loading ? <div className="h-56 animate-pulse rounded-2xl bg-neutral-100 dark:bg-neutral-900" /> : <TrendLineChart points={chartPoints} valueLabel={metric} formatValue={format} />}
      </div>
    </section>
  );
}
