export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

/** Minimal placeholder card summarizing the member's current and longest streak. */
export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">Streak</p>
      <div className="mt-1 flex gap-4 text-sm opacity-70">
        <span>Current: {currentStreak}</span>
        <span>Longest: {longestStreak}</span>
      </div>
    </div>
  );
}
