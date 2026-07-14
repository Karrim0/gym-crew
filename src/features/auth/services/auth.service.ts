import { createClient } from "@/lib/supabase/client";
import type { LoginInput } from "../schemas/login.schema";
import type { RegisterInput } from "../schemas/register.schema";
import type { ForgotPasswordInput } from "../schemas/forgot-password.schema";
import type { UpdatePasswordInput } from "../schemas/update-password.schema";

function getBrowserOrigin(): string | undefined {
  return typeof window === "undefined" ? undefined : window.location.origin;
}

export async function signInWithPassword({ email, password }: LoginInput) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email, password });
}

export async function signUpWithPassword({ email, password, displayName }: RegisterInput) {
  const supabase = createClient();
  const origin = getBrowserOrigin();

  return supabase.auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName.trim() },
      ...(origin
        ? { emailRedirectTo: `${origin}/auth/callback?next=/onboarding` }
        : {}),
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function sendPasswordResetEmail({ email }: ForgotPasswordInput) {
  const supabase = createClient();
  const origin = getBrowserOrigin();

  return supabase.auth.resetPasswordForEmail(email, {
    ...(origin ? { redirectTo: `${origin}/auth/callback?next=/update-password` } : {}),
  });
}

export async function updatePassword({ password }: UpdatePasswordInput) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password });
}
