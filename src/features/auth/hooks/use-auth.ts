"use client";

import { useSessionContext } from "@/contexts/session-context";
import { signOut } from "../services/auth.service";

/**
 * Feature-facing convenience hook over the root `SessionContext`, plus the
 * sign-out action. Prefer this in auth-related UI over importing the
 * context directly.
 */
export function useAuth() {
  const { user, isLoading } = useSessionContext();
  return { user, isLoading, signOut };
}
