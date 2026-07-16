import { muscleLabelAr } from "@/lib/localization";
import { formatWeight } from "@/lib/utils/format";
import type { MuscleAnalyticsSummary, MuscleMetric } from "@/features/progress/services/progress.service";

export function MuscleSummary({
  muscles,
  metric,
}: {
  muscles: MuscleAnalyticsSummary[];
  metric: MuscleMetric;
}) {
  const active = muscles.filter((item) => item.weightedSets > 0).slice(0, 10);
  if (active.length === 0) {
    return <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-neutral-500">كمّل شوية سِتات عشان خريطة العضلات تبدأ تظهر.</p>;
  }

  const max = Math.max(1, ...active.map((item) => metric === "sets" ? item.weightedSets : item.weightedVolumeKg));
  return (
    <section className="rounded-[26px] border bg-white p-4 dark:bg-neutral-950">
      <div>
        <h3 className="font-bold">تفصيل العضلات</h3>
        <p className="text-sm text-neutral-500">العضلة الأساسية بتتحسب كاملة، والعضلات المساعدة بتتحسب كمجهود داعم.</p>
      </div>
      <div className="mt-4 space-y-3">
        {active.map((item) => {
          const value = metric === "sets" ? item.weightedSets : item.weightedVolumeKg;
          return (
            <div key={muscleLabelAr(item.muscle)}>
              <div className="mb-1 flex items-center justify-between gap-3 text-sm">
                <span className="font-semibold capitalize">{muscleLabelAr(item.muscle)}</span>
                <span className="text-neutral-500">
                  {metric === "sets" ? `${value.toFixed(value % 1 === 0 ? 0 : 1)} سِت` : formatWeight(value)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-neutral-100 dark:bg-neutral-800">
                <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(3, value / max * 100)}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
