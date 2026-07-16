/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import { useCallback, useEffect, useState } from "react";
import { Award, Dumbbell, Flame, UserPlus, UserRound } from "lucide-react";
import { formatRelativeTimeArEg, translateExerciseName } from "@/lib/localization";
import { formatDuration, formatWeight } from "@/lib/utils/format";
import type { UUID } from "@/types";
import type { GroupActivityFeedItem } from "../types";
import { fetchGroupActivityFeed } from "../services/group.service";

function ActivityIcon({ type }: { type: GroupActivityFeedItem["type"] }) {
  const className = "h-5 w-5";
  if (type === "personal_record") return <Award className={`${className} text-amber-500`} />;
  if (type === "joined_group") return <UserPlus className={`${className} text-blue-500`} />;
  if (type === "streak_milestone") return <Flame className={`${className} text-orange-500`} />;
  return <Dumbbell className={`${className} text-emerald-500`} />;
}

function activityDescription(activity: GroupActivityFeedItem): string {
  if (activity.type === "joined_group") return "دخل الجروب";
  if (activity.type === "streak_milestone") return "وصل لسلسلة التزام جديدة";
  if (activity.type === "workout_completed") {
    const duration = activity.metadata.duration_seconds;
    return typeof duration === "number" && duration > 0
      ? `خلّص تمرينة في ${formatDuration(duration)}`
      : "خلّص تمرينة";
  }

  const rawRecordType = typeof activity.metadata.record_type === "string"
    ? activity.metadata.record_type
    : "personal_record";
  const recordType = rawRecordType === "max_weight"
    ? "أعلى وزن"
    : rawRecordType === "max_reps"
      ? "أعلى عدات"
      : rawRecordType === "max_volume"
        ? "أعلى حجم تمرين"
        : "رقم شخصي";
  const value = activity.metadata.value;
  const suffix = activity.showWeights && typeof value === "number"
    ? ` · ${rawRecordType === "max_reps" ? `${value} عدة` : formatWeight(value)}`
    : "";
  const exercise = activity.exerciseName ? ` في ${translateExerciseName(activity.exerciseName)}` : "";
  return `عمل ${recordType} جديد${exercise}${suffix}`;
}

export function GroupActivityFeedClient({ groupId }: { groupId: UUID }) {
  const [items, setItems] = useState<GroupActivityFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchGroupActivityFeed(groupId));
    } catch (caught) {
      setError(getArabicErrorMessage(caught, "معرفناش نحمّل نشاط الجروب."));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => { void load(); }, [load]);

  if (loading) return <div className="space-y-3">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-20 animate-pulse rounded-2xl bg-white/[0.035]" />)}</div>;
  if (error) return <p className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">{error}</p>;
  if (items.length === 0) return <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-neutral-500">النشاط هيظهر لما الأعضاء يخلّصوا تمرينات أو يكسروا أرقام أو يدخلوا الجروب.</p>;

  return (
    <div className="space-y-3">
      {items.map((activity) => (
        <article key={activity.id} className="gc-card flex gap-3 p-4">
          {activity.actorAvatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={activity.actorAvatarUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
          ) : (
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white/[0.06]"><UserRound className="h-5 w-5" /></span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-start gap-2">
              <span className="mt-0.5"><ActivityIcon type={activity.type} /></span>
              <p className="text-sm"><strong>{activity.actorName}</strong> {activityDescription(activity)}</p>
            </div>
            <p className="mt-1 text-xs text-neutral-500">{formatRelativeTimeArEg(activity.createdAt)}</p>
          </div>
        </article>
      ))}
    </div>
  );
}
