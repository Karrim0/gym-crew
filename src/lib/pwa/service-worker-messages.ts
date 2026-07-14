/**
 * Typed message contract between the app and `public/sw.js`. Keeping this
 * in one place prevents the page and the service worker from silently
 * drifting apart on message shapes, since they cannot share TypeScript
 * types directly (the service worker is plain JS at runtime).
 */
export type ServiceWorkerMessage = { type: "SKIP_WAITING" } | { type: "SYNC_NOW" };

export function postMessageToServiceWorker(message: ServiceWorkerMessage): void {
  if (typeof navigator === "undefined" || !navigator.serviceWorker?.controller) {
    return;
  }
  navigator.serviceWorker.controller.postMessage(message);
}
