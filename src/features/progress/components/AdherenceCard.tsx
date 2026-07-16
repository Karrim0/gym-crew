import { formatAdherencePercentage } from "@/features/progress/utils/format-adherence";

export interface AdherenceCardProps {
  weekly: number | null;
  monthly: number | null;
}

/** Minimal placeholder card summarizing weekly and monthly adherence. */
export function AdherenceCard({ weekly, monthly }: AdherenceCardProps) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-sm font-medium">الالتزام</p>
      <div className="mt-1 flex gap-4 text-sm opacity-70">
        <span>الأسبوع: {formatAdherencePercentage(weekly)}</span>
        <span>الشهر: {formatAdherencePercentage(monthly)}</span>
      </div>
    </div>
  );
}
