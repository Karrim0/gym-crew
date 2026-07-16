"use client";

export interface FinishWorkoutButtonProps {
  onFinish?: () => void;
  disabled?: boolean;
}

/** Minimal placeholder button to complete and sync the active workout session. */
export function FinishWorkoutButton({ onFinish, disabled }: FinishWorkoutButtonProps) {
  return (
    <button
      type="button"
      onClick={onFinish}
      disabled={disabled}
      className="w-full rounded-md border p-3 text-center font-medium"
    >
      خلّص التمرينة
    </button>
  );
}
