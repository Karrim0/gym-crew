import type { MuscleGroup } from "@/types";
import type { MuscleActivityLevel } from "../types";

export interface BodyMapProps {
  muscleActivity: MuscleActivityLevel[];
}

function getIntensity(items: MuscleActivityLevel[], muscle: MuscleGroup): number {
  return Math.max(0, Math.min(1, items.find((item) => item.muscle === muscle)?.intensity ?? 0));
}

function MuscleShape({
  muscle,
  activity,
  children,
}: {
  muscle: MuscleGroup;
  activity: MuscleActivityLevel[];
  children: React.ReactNode;
}) {
  const intensity = getIntensity(activity, muscle);
  return (
    <g
      aria-label={`${muscle}: ${Math.round(intensity * 100)}% relative activity`}
      className="text-emerald-500 transition-opacity"
      style={{ opacity: 0.14 + intensity * 0.86 }}
    >
      {children}
    </g>
  );
}

function FrontBody({ activity }: { activity: MuscleActivityLevel[] }) {
  return (
    <svg viewBox="0 0 180 390" role="img" aria-label="Front muscle activity" className="h-[310px] w-full max-w-[180px]">
      <title>Front body muscle activity</title>
      <g fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-300 dark:text-neutral-700">
        <circle cx="90" cy="30" r="20" />
        <path d="M70 52 C55 64 45 88 45 116 L35 190 M110 52 C125 64 135 88 135 116 L145 190" />
        <path d="M69 52 C75 60 105 60 111 52 L125 135 L112 205 L105 360 M111 205 L90 220 L69 205 M69 52 L55 135 L68 205 L75 360" />
        <path d="M35 190 L30 260 M145 190 L150 260" />
        <path d="M75 360 L70 382 M105 360 L110 382" />
      </g>

      <MuscleShape muscle="shoulders" activity={activity}>
        <ellipse cx="58" cy="77" rx="17" ry="22" fill="currentColor" />
        <ellipse cx="122" cy="77" rx="17" ry="22" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="chest" activity={activity}>
        <path d="M67 75 Q90 65 89 108 Q72 112 58 99 Z" fill="currentColor" />
        <path d="M113 75 Q90 65 91 108 Q108 112 122 99 Z" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="biceps" activity={activity}>
        <ellipse cx="43" cy="132" rx="10" ry="27" fill="currentColor" />
        <ellipse cx="137" cy="132" rx="10" ry="27" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="core" activity={activity}>
        <rect x="73" y="112" width="15" height="28" rx="6" fill="currentColor" />
        <rect x="92" y="112" width="15" height="28" rx="6" fill="currentColor" />
        <rect x="73" y="143" width="15" height="27" rx="6" fill="currentColor" />
        <rect x="92" y="143" width="15" height="27" rx="6" fill="currentColor" />
        <path d="M66 113 Q58 143 68 174 L76 166 L73 116 Z" fill="currentColor" />
        <path d="M114 113 Q122 143 112 174 L104 166 L107 116 Z" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="quads" activity={activity}>
        <path d="M69 207 Q53 242 66 300 Q76 315 87 295 L85 222 Z" fill="currentColor" />
        <path d="M111 207 Q127 242 114 300 Q104 315 93 295 L95 222 Z" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="calves" activity={activity}>
        <path d="M67 304 Q55 333 68 360 Q77 366 82 350 L80 311 Z" fill="currentColor" />
        <path d="M113 304 Q125 333 112 360 Q103 366 98 350 L100 311 Z" fill="currentColor" />
      </MuscleShape>
    </svg>
  );
}

function BackBody({ activity }: { activity: MuscleActivityLevel[] }) {
  return (
    <svg viewBox="0 0 180 390" role="img" aria-label="Back muscle activity" className="h-[310px] w-full max-w-[180px]">
      <title>Back body muscle activity</title>
      <g fill="none" stroke="currentColor" strokeWidth="3" className="text-neutral-300 dark:text-neutral-700">
        <circle cx="90" cy="30" r="20" />
        <path d="M70 52 C55 64 45 88 45 116 L35 190 M110 52 C125 64 135 88 135 116 L145 190" />
        <path d="M69 52 C75 60 105 60 111 52 L125 135 L112 205 L105 360 M111 205 L90 220 L69 205 M69 52 L55 135 L68 205 L75 360" />
        <path d="M35 190 L30 260 M145 190 L150 260" />
        <path d="M75 360 L70 382 M105 360 L110 382" />
      </g>

      <MuscleShape muscle="shoulders" activity={activity}>
        <ellipse cx="58" cy="77" rx="17" ry="22" fill="currentColor" />
        <ellipse cx="122" cy="77" rx="17" ry="22" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="back" activity={activity}>
        <path d="M72 68 Q51 89 62 151 L82 175 L88 100 Z" fill="currentColor" />
        <path d="M108 68 Q129 89 118 151 L98 175 L92 100 Z" fill="currentColor" />
        <path d="M77 68 Q90 58 103 68 L99 105 L90 116 L81 105 Z" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="triceps" activity={activity}>
        <ellipse cx="42" cy="133" rx="10" ry="29" fill="currentColor" />
        <ellipse cx="138" cy="133" rx="10" ry="29" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="glutes" activity={activity}>
        <ellipse cx="75" cy="202" rx="22" ry="24" fill="currentColor" />
        <ellipse cx="105" cy="202" rx="22" ry="24" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="hamstrings" activity={activity}>
        <path d="M67 225 Q56 256 68 301 Q78 310 87 294 L84 226 Z" fill="currentColor" />
        <path d="M113 225 Q124 256 112 301 Q102 310 93 294 L96 226 Z" fill="currentColor" />
      </MuscleShape>
      <MuscleShape muscle="calves" activity={activity}>
        <path d="M67 304 Q55 333 68 360 Q77 366 82 350 L80 311 Z" fill="currentColor" />
        <path d="M113 304 Q125 333 112 360 Q103 366 98 350 L100 311 Z" fill="currentColor" />
      </MuscleShape>
    </svg>
  );
}

export function BodyMap({ muscleActivity }: BodyMapProps) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-[28px] border bg-white p-3 shadow-sm dark:bg-neutral-950">
      <div className="text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Front</p>
        <FrontBody activity={muscleActivity} />
      </div>
      <div className="text-center">
        <p className="mb-1 text-xs font-bold uppercase tracking-[0.14em] text-neutral-500">Back</p>
        <BackBody activity={muscleActivity} />
      </div>
    </div>
  );
}
