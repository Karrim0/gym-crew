import "server-only";

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { env } from "@/lib/env";
import type { Database } from "./types";

/**
 * Server Supabase client for use in Server Components, Route Handlers, and
 * Server Actions. Reads/writes the auth session via Next.js `cookies()`.
 *
 * `server-only` guarantees this module (and therefore any service-role
 * logic layered on top of it later) can never be pulled into a client
 * bundle by accident.
 *
 * Create a new client per request — never cache or share this across
 * requests.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(env.supabase.url(), env.supabase.anonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component where cookies cannot be mutated.
          // Safe to ignore as long as proxy.ts is also refreshing the
          // session (see src/proxy.ts).
        }
      },
    },
  });
}
