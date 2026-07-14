import { redirect } from "next/navigation";

/**
 * Root route. Middleware (`src/proxy.ts`) already redirects
 * unauthenticated users away from protected routes, so this simply hands
 * off to the dashboard; unauthenticated visitors land on `/login` instead.
 */
export default function RootPage() {
  redirect("/dashboard");
}
