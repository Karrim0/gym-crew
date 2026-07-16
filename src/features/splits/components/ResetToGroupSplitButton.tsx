"use client";

export interface ResetToGroupSplitButtonProps {
  onReset?: () => void;
}

/** Minimal placeholder button to discard personal split customizations. */
export function ResetToGroupSplitButton({ onReset }: ResetToGroupSplitButtonProps) {
  return (
    <button type="button" onClick={onReset} className="text-sm underline">
      رجّع جدول الجروب
    </button>
  );
}
