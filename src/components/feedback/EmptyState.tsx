import type { LucideIcon } from "lucide-react";

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
}

/** Minimal placeholder for "nothing here yet" states (e.g. no workouts logged). */
export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      {Icon ? <Icon className="h-8 w-8" aria-hidden /> : null}
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm opacity-70">{description}</p> : null}
    </div>
  );
}
