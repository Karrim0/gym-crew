/** Formats a 0–1 adherence ratio as a whole-number percentage, e.g. 0.825 -> "83%". */
export function formatAdherencePercentage(ratio: number | null): string {
  if (ratio === null) {
    return "—";
  }
  return `${Math.round(ratio * 100)}%`;
}
