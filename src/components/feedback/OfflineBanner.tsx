"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";

/** Minimal banner shown when the app detects it is offline. */
export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div role="status" className="w-full p-2 text-center text-sm">
      You&apos;re offline. Workouts will sync once you&apos;re back online.
    </div>
  );
}
