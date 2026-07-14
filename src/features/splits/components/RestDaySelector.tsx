"use client";

import { WEEKDAYS_STARTING_SATURDAY, FIXED_REST_DAY, MAX_PERSONAL_REST_DAYS } from "@/constants/schedule";
import type { Weekday } from "@/types";

export interface RestDaySelectorProps {
  selectedDays: Weekday[];
  onChange?: (days: Weekday[]) => void;
}

/**
 * Minimal placeholder for choosing up to `MAX_PERSONAL_REST_DAYS` additional
 * rest days. Friday (`FIXED_REST_DAY`) is always shown as fixed/disabled —
 * see `personalRestDaySchema` for the corresponding validation rule.
 */
export function RestDaySelector({ selectedDays, onChange }: RestDaySelectorProps) {
  const selectableDays = WEEKDAYS_STARTING_SATURDAY.filter((day) => day !== FIXED_REST_DAY);

  function toggleDay(day: Weekday) {
    if (!onChange) return;
    const isSelected = selectedDays.includes(day);
    if (isSelected) {
      onChange(selectedDays.filter((d) => d !== day));
      return;
    }
    if (selectedDays.length >= MAX_PERSONAL_REST_DAYS) {
      return;
    }
    onChange([...selectedDays, day]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <span className="w-full text-sm opacity-70">
        Friday is always a rest day. Choose up to {MAX_PERSONAL_REST_DAYS} more.
      </span>
      {selectableDays.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => toggleDay(day)}
          aria-pressed={selectedDays.includes(day)}
          className="rounded-full border px-3 py-1 text-sm capitalize"
        >
          {day}
        </button>
      ))}
    </div>
  );
}
