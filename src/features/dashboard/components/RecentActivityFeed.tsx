import type { GroupActivity } from "@/types";
import { EmptyState } from "@/components/feedback/EmptyState";

export interface RecentActivityFeedProps {
  activity: GroupActivity[];
}

/** Minimal placeholder feed of recent group activity, shown on the dashboard. */
export function RecentActivityFeed({ activity }: RecentActivityFeedProps) {
  if (activity.length === 0) {
    return <EmptyState title="مفيش نشاط لسه" description="تمارين الجروب هتظهر هنا." />;
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
