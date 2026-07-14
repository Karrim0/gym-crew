import type { GroupActivity } from "@/types";
import { EmptyState } from "@/components/feedback/EmptyState";

export interface RecentActivityFeedProps {
  activity: GroupActivity[];
}

/** Minimal placeholder feed of recent group activity, shown on the dashboard. */
export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  if (activity.length === 0) {
    return <EmptyState title="No activity yet" description="Your group's workouts will show up here." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {activity.map((item) => (
        <li key={item.id} className="text-sm">
          {item.message}
        </li>
      ))}
    </ul>
  );
}
