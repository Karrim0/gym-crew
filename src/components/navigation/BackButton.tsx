"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";

export interface BackButtonProps {
  fallbackHref?: string;
}

/** Minimal back-navigation button used by `DashboardHeader`. */
export function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="Go back"
      onClick={() => (fallbackHref ? router.push(fallbackHref) : router.back())}
      className="inline-flex items-center justify-center"
    >
      <ChevronLeft className="h-5 w-5" aria-hidden />
    </button>
  );
}
