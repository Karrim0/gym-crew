import type { SplitDay } from "@/types";
import { SplitExerciseItem } from "./SplitExerciseItem";

export interface SplitDayCardProps {
  splitDay: SplitDay;
}

/** Minimal placeholder card for a single day within a weekly split. */
export function SplitDayCard({ splitDay }: SplitDayCardProps) {
  const isRestDay = splitDay.workoutType === "rest";

  return (
    <section className="rounded-lg border p-3">
      <header className="flex items-center justify-between">
        <span className="font-medium capitalize">{splitDay.weekday}</span>
        <span className="text-sm opacity-70">{isRestDay ? "Rest day" : splitDay.workoutType}</span>
      </header>
      {!isRestDay ? (
        <ul className="mt-2 flex flex-col gap-1">
          {splitDay.exercises.map((exercise) => (
            <SplitExerciseItem key={exercise.id} splitExercise={exercise} />
          ))}
        </ul>
      ) : null}
    </section>
  );
}
