import { formatWeight } from "@/lib/utils/format";

export interface VolumeSummaryProps {
  totalVolumeKg: number;
}

/** Minimal placeholder card summarizing total training volume. */
export function VolumeSummary({ totalVolumeKg }: VolumeSummaryProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">حجم التمرين</p>
      <p className="mt-1 text-sm opacity-70">{formatWeight(totalVolumeKg)}</p>
    </div>
  );
}
