import type { MuscleActivityLevel } from "../types";

export interface BodyMapProps {
  muscleActivity: MuscleActivityLevel[];
}

/**
 * Minimal placeholder for a visual front/back body diagram highlighting
 * recently-trained muscle groups. No finished visual design yet.
 */
export function BodyMap({ muscleActivity }: BodyMapProps) {
  return (
    <div className="flex h-64 items-center justify-center rounded-lg border text-sm opacity-70">
      Body map ({muscleActivity.length} muscle groups tracked)
    </div>
  );
}
