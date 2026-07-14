"use client";

import { useEffect, type ReactNode } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";
import { NetworkProvider } from "./NetworkProvider";
import { SupabaseProvider } from "./SupabaseProvider";
import { OfflineCacheWarmer } from "./OfflineCacheWarmer";

interface AppProvidersProps {
  children: ReactNode;
}

/**
 * Composes the app-wide client providers and mounts them once from the root
 * layout. `StopwatchProvider` is intentionally not included here — it is
 * scoped to the active-workout route only, see `StopwatchProvider.tsx`.
 */
export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <SupabaseProvider>
      <NetworkProvider><OfflineCacheWarmer />{children}</NetworkProvider>
    </SupabaseProvider>
  );
}
