"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Search } from "lucide-react";
import { formatWorkoutDate } from "@/lib/dates";
import { muscleLabelAr, translateExerciseName } from "@/lib/localization";
import { formatWeight } from "@/lib/utils/format";
import type { UUID } from "@/types";
import { fetchExerciseProgressSummaries, type ExerciseProgressSummary } from "../services/progress.service";

export function ExerciseProgressListClient({ userId }: { userId: UUID }) {
  const [items, setItems] = useState<ExerciseProgressSummary[]>([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchExerciseProgressSummaries(userId).then(setItems).finally(() => setIsLoading(false));
  }, [userId]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => !normalized || item.exerciseName.toLowerCase().includes(normalized) || item.primaryMuscle.includes(normalized));
  }, [items, query]);

  if (isLoading) return <p className="py-12 text-center text-sm text-neutral-500">بنجهّز سجل التمرين…</p>;

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 rounded-xl border bg-white px-3 dark:bg-neutral-950"><Search className="h-4 w-4 text-neutral-400" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="دوّر على تمرين أو عضلة" className="w-full bg-transparent py-3 outline-none" /></label>
      {visible.length === 0 ? <p className="rounded-2xl border p-6 text-center text-sm text-neutral-500">مفيش تمارين مكتملة لسه.</p> : null}
      <div className="space-y-3">
        {visible.map((item) => (
          <Link key={item.exerciseId} href={`/progress/exercises/${item.exerciseId}`} className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950">
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-bold">{translateExerciseName(item.exerciseName)}</h2>
              <p className="text-xs capitalize text-neutral-500">{muscleLabelAr(item.primaryMuscle)} · {item.sessionCount} تمرينات · آخر مرة {formatWorkoutDate(item.lastTrainedAt)}</p>
              <div className="mt-2 flex gap-4 text-sm"><span>أعلى وزن <strong>{formatWeight(item.maxWeightKg)}</strong></span><span>أقصى عدة متوقعة <strong>{formatWeight(item.estimatedOneRepMaxKg)}</strong></span></div>
            </div>
            <ChevronLeft className="h-5 w-5" />
          </Link>
        ))}
      </div>
    </div>
  );
}
