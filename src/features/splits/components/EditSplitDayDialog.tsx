"use client";

import type { SplitDay } from "@/types";

export interface EditSplitDayDialogProps {
  splitDay: SplitDay;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (splitDay: SplitDay) => void;
}

/** Minimal placeholder dialog for editing a split day's exercises and targets. */
export function EditSplitDayDialog({ splitDay, isOpen, onClose }: EditSplitDayDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div role="dialog" aria-modal className="fixed inset-0 flex items-center justify-center">
      <div className="rounded-lg border bg-white p-4 dark:bg-neutral-900">
        <h2 className="font-medium capitalize">Edit {splitDay.weekday}</h2>
        <button type="button" onClick={onClose} className="mt-4 text-sm">
          Close
        </button>
      </div>
    </div>
  );
}
