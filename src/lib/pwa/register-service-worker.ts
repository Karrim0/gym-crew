import { SERVICE_WORKER_URL } from "@/lib/constants";

/**
 * Registers `public/sw.js`. Called once from a client component
 * (see `components/providers/AppProviders.tsx`) after mount.
 */
export function registerServiceWorker(): void {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return;
  }

  window.addEventListener("load", () => {
    navigator.serviceWorker.register(SERVICE_WORKER_URL).catch((error: unknown) => {
      console.error("Service worker registration failed:", error);
    });
  });
}
