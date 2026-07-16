"use client";

import { getArabicErrorMessage } from "@/lib/localization";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Trash2, X } from "lucide-react";
import type { UUID } from "@/types";
import { deleteCompletedWorkoutSession } from "../services/workout-session.service";

export function DeleteWorkoutSessionButton({ sessionId }: { sessionId: UUID }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDelete() {
    setIsDeleting(true);
    setError(null);
    try {
      await deleteCompletedWorkoutSession(sessionId);
      router.replace("/workout/history?deleted=1");
      router.refresh();
    } catch (caught) {
      setError(getArabicErrorMessage(caught, "معرفناش نمسح التمرينة."));
      setIsDeleting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="gc-danger-button w-full sm:w-auto">
        <Trash2 className="h-4 w-4" /> امسح التمرينة
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80] grid place-items-end bg-black/70 p-3 backdrop-blur-sm sm:place-items-center" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-workout-title" className="w-full max-w-md rounded-[22px] border border-white/10 bg-[#151821] p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-red-400/10 text-red-300"><AlertTriangle className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 id="delete-workout-title" className="text-lg font-bold">تمسح التمرينة دي؟</h2>
                <p className="mt-1 text-sm leading-6 text-neutral-400">ده هيمسح التمرينة وسِتاتها وتأثيرها على الإحصائيات والأرقام والالتزام. مينفعش ترجعها.</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} disabled={isDeleting} className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-white/5" aria-label="قفل"><X className="h-4 w-4" /></button>
            </div>

            {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-300">{error}</p> : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setOpen(false)} disabled={isDeleting} className="gc-secondary-button">سيب التمرينة</button>
              <button type="button" onClick={() => void confirmDelete()} disabled={isDeleting} className="gc-danger-button">
                <Trash2 className="h-4 w-4" /> {isDeleting ? "بنمسح…" : "امسح"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
