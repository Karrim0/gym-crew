"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Dumbbell } from "lucide-react";
import { createSoloWorkspace } from "@/features/groups/services/group.service";

export function SoloModeButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function enableSoloMode() {
    setIsLoading(true);
    setError(null);
    try {
      await createSoloWorkspace();
      router.replace("/dashboard");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to start solo mode.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void enableSoloMode()}
        disabled={isLoading}
        className="gc-card-interactive flex w-full items-center gap-4 p-4 text-left disabled:opacity-50"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-300 text-neutral-950">
          <Dumbbell className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Train solo</span>
          <span className="mt-0.5 block text-sm text-neutral-400">
            {isLoading ? "Preparing your space…" : "Build your own split and track private progress."}
          </span>
        </span>
        <ArrowRight className="h-5 w-5 text-neutral-500" />
      </button>
      {error ? <p className="rounded-xl bg-red-400/10 px-3 py-2 text-sm font-semibold text-red-300">{error}</p> : null}
    </div>
  );
}
