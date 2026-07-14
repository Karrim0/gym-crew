export const SERVICE_WORKER_MESSAGES = {
  clearPrivateCache: "CLEAR_PRIVATE_CACHE",
} as const;

export async function clearPrivatePageCache(): Promise<void> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
  const registration = await navigator.serviceWorker.getRegistration();
  registration?.active?.postMessage({ type: SERVICE_WORKER_MESSAGES.clearPrivateCache });
}
