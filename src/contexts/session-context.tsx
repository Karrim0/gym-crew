"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

export interface SessionContextValue {
  user: User | null;
  isLoading: boolean;
}

export const SessionContext = createContext<SessionContextValue | undefined>(undefined);

/**
 * Access the current authenticated Supabase user. Must be used within
 * `SupabaseProvider` (see `components/providers/SupabaseProvider.tsx`).
 */
export function useSessionContext(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSessionContext must be used within SupabaseProvider.");
  }
  return context;
}
