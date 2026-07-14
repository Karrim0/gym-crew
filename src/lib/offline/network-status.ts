/**
 * Subscribes to browser online/offline events.
 *
 * This is a thin wrapper so consumers (e.g. `NetworkProvider`) don't touch
 * `window` directly, which keeps this module the single place that needs to
 * account for SSR (no `window`) and browser quirks (e.g. `navigator.onLine`
 * being unreliable on some platforms).
 *
 * @param onChange - called with `true` when the browser goes online, `false`
 * when it goes offline.
 * @returns an unsubscribe function.
 */
export function subscribeToNetworkStatus(onChange: (isOnline: boolean) => void): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => onChange(true);
  const handleOffline = () => onChange(false);

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export function getCurrentNetworkStatus(): boolean {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return true;
  }
  return navigator.onLine;
}
