"use client";

export interface WorkoutNotesProps {
  value: string;
  onChange?: (value: string) => void;
}

/** Minimal placeholder free-text notes field for a workout session. */
export function WorkoutNotes({ value, onChange }: WorkoutNotesProps) {
  return (
    <textarea
      value={value}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder="ملاحظات"
      className="w-full rounded-md border p-2 text-sm"
      rows={3}
    />
  );
}
