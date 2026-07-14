/** Minimal placeholder legend explaining the body map's intensity color scale. */
export function MuscleActivityLegend() {
  return (
    <div className="flex items-center gap-2 text-xs opacity-70">
      <span>Less trained</span>
      <div className="h-2 w-16 rounded-full border" />
      <span>More trained</span>
    </div>
  );
}
