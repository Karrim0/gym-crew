"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell } from "lucide-react";
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
        className="inline-flex w-full items-center justify-center gap-2 rounded-md border p-2 font-medium disabled:opacity-50"
      >
        <Dumbbell className="h-4 w-4" />
        {isLoading ? "Preparing your split…" : "Continue as a solo athlete"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
