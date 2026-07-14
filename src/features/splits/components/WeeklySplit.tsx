import type { SplitDay } from "@/types";
import { sortWeekdaysStartingSaturday } from "@/lib/dates";
import { SplitDayCard } from "./SplitDayCard";

export interface WeeklySplitProps {
  splitDays: SplitDay[];
}

/** Minimal placeholder listing all seven days of a split, Saturday first. */
export function WeeklySplit({ splitDays }: WeeklySplitProps) {
  const orderedWeekdays = sortWeekdaysStartingSaturday(splitDays.map((day) => day.weekday));
  const dayByWeekday = new Map(splitDays.map((day) => [day.weekday, day]));

  return (
    <div className="flex flex-col gap-2">
      {orderedWeekdays.map((weekday) => {
        const day = dayByWeekday.get(weekday);
        return day ? <SplitDayCard key={day.id} splitDay={day} /> : null;
      })}
    </div>
  );
}
