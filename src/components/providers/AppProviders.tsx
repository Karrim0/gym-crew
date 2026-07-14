"use client";

import { useEffect, type ReactNode } from "react";
import { registerServiceWorker } from "@/lib/pwa/register-service-worker";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";
import { NetworkProvider } from "./NetworkProvider";
import { SupabaseProvider } from "./SupabaseProvider";
import { OfflineCacheWarmer } from "./OfflineCacheWarmer";
import { RestTimerProvider } from "./RestTimerProvider";

interface AppProvidersProps {
  children: ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  useEffect(() => registerServiceWorker(), []);

  return (
    <SupabaseProvider>
      <NetworkProvider>
        <RestTimerProvider>
          <OfflineCacheWarmer />
          {children}
          <PwaInstallPrompt />
        </RestTimerProvider>
      </NetworkProvider>
    </SupabaseProvider>
  );
}
