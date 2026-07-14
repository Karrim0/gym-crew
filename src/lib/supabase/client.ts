"use client";

import { createBrowserClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Browser Supabase client. Safe to use in client components — it only ever
 * holds the public anon key, never the service-role key.
 *
 * Create a fresh client per call site rather than exporting a shared
 * singleton at module scope, since Next.js can evaluate client modules in
 * more than one bundle context.
 */
export function createClient() {
  return createBrowserClient<Database>(env.supabase.url(), env.supabase.anonKey());
}
