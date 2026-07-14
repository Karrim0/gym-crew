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
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    void fetchTrainingTrend(userId, 8)
      .then((next) => { if (active) setPoints(next); })
      .catch(() => { if (active) setError(true); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [userId]);

  const chartPoints = useMemo(() => points.map((point) => ({
    label: point.label,
    value: metric === "volume" ? point.volumeKg : metric === "sets" ? point.workingSets : point.sessions,
  })), [metric, points]);

  const format = metric === "volume" ? (value: number) => formatWeight(value) : (value: number) => Math.round(value).toString();

  return (
    <section className="gc-card p-4 sm:p-5">
      <div>
        <p className="gc-eyebrow">Training load</p>
        <h3 className="mt-1 text-lg font-black">8-week trend</h3>
        <p className="mt-1 text-sm text-neutral-500">Completed work including sessions logged offline.</p>
      </div>
      <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
        {METRICS.map((item) => (
          <button key={item.key} type="button" onClick={() => setMetric(item.key)} className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-black transition ${metric === item.key ? "bg-lime-300 text-neutral-950" : "border border-white/[0.07] bg-white/[0.035] text-neutral-400"}`}>
            {item.icon}{item.label}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {loading ? <div className="h-56 animate-pulse rounded-2xl bg-white/[0.035]" /> : error ? <div className="grid h-48 place-items-center rounded-2xl border border-dashed border-red-400/20 text-sm text-red-300">Unable to load trend data.</div> : <TrendLineChart points={chartPoints} valueLabel={metric} formatValue={format} />}
      </div>
    </section>
  );
}
