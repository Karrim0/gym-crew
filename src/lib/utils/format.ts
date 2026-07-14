/** Formats a weight in kilograms for display, e.g. `82.5` -> "82.5 kg". */
export function formatWeight(weightKg: number): string {
  const trimmed = Number.isInteger(weightKg) ? weightKg.toString() : weightKg.toFixed(1);
  return `${trimmed} kg`;
}

/** Formats a duration in seconds as `mm:ss`, or `h:mm:ss` past one hour. */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  const pad = (value: number) => value.toString().padStart(2, "0");

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}`;
}
