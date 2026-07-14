const MILESTONE_THRESHOLDS = [7, 30, 100, 365] as const;

/** Returns the milestone value reached if `streak` exactly matches one, otherwise `null`. */
export function getStreakMilestone(streak: number): number | null {
  return MILESTONE_THRESHOLDS.find((threshold) => threshold === streak) ?? null;
}
