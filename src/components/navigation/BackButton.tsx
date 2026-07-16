"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

export interface BackButtonProps {
  fallbackHref?: string;
}

/** Minimal back-navigation button used by `DashboardHeader`. */
export function BackButton({ fallbackHref }: BackButtonProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      aria-label="ارجع"
      onClick={() => (fallbackHref ? router.push(fallbackHref) : router.back())}
      className="gc-icon-button"
    >
      <ChevronRight className="h-5 w-5" aria-hidden />
    </button>
  );
}
