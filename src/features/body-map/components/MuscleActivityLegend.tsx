export function MuscleActivityLegend({ metricLabel }: { metricLabel: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-white p-3 text-xs text-neutral-500 dark:bg-neutral-950">
      <span>قليل</span>
      <span className="h-2 flex-1 rounded-full bg-gradient-to-r from-emerald-500/15 via-emerald-500/55 to-emerald-500" />
      <span>عالي</span>
      <span className="mr-auto font-semibold text-neutral-700 dark:text-neutral-200">حسب {metricLabel}</span>
    </div>
  );
}
