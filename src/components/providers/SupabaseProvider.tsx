"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { SessionContext, type SessionContextValue } from "@/contexts/session-context";

interface SupabaseProviderProps {
  children: ReactNode;
}

/**
 * Provides the current authenticated user to the client tree and keeps it
 * in sync with Supabase auth state changes (sign in, sign out, token
 * refresh). The initial value is loaded client-side; pages that need the
 * user for a first-paint decision should still read it via
 * `lib/supabase/server.ts` directly rather than waiting on this provider.
 */
export function SupabaseProvider({ children }: SupabaseProviderProps) {
  const [value, setValue] = useState<SessionContextValue>({ user: null, isLoading: true });

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setValue({ user: data.user, isLoading: false });
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setValue({ user: session?.user ?? null, isLoading: false });
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return <SessionContext value={value}>{children}</SessionContext>;
}
