export interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
}

/** Minimal placeholder card summarizing the member's current and longest streak. */
export function StreakCard({ currentStreak, longestStreak }: StreakCardProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">السلسلة</p>
      <div className="mt-1 flex gap-4 text-sm opacity-70">
        <span>الحالية: {currentStreak}</span>
        <span>الأطول: {longestStreak}</span>
      </div>
    </div>
  );
}
