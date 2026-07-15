import { createClient } from "@/lib/supabase/client";
import type { LoginInput } from "../schemas/login.schema";
import type { RegisterInput } from "../schemas/register.schema";
import type { ForgotPasswordInput } from "../schemas/forgot-password.schema";
import type { UpdatePasswordInput } from "../schemas/update-password.schema";

const configuredAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "");

function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  if (configuredAppUrl) {
    return configuredAppUrl;
  }

  return "http://localhost:3000";
}

function buildAuthRedirect(path: string): string {
  return new URL(path, `${getAppOrigin()}/`).toString();
}

export async function signInWithPassword({ email, password }: LoginInput) {
  const supabase = createClient();
  return supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password });
}

export async function signUpWithPassword({ email, password, displayName }: RegisterInput) {
  const supabase = createClient();

  return supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: {
      data: { display_name: displayName.trim() },
      emailRedirectTo: buildAuthRedirect("/auth/callback?next=/onboarding"),
    },
  });
}

export async function resendSignUpEmail(email: string) {
  const supabase = createClient();
  return supabase.auth.resend({
    type: "signup",
    email: email.trim().toLowerCase(),
    options: {
      emailRedirectTo: buildAuthRedirect("/auth/callback?next=/onboarding"),
    },
  });
}

export async function signOut() {
  const supabase = createClient();
  return supabase.auth.signOut();
}

export async function sendPasswordResetEmail({ email }: ForgotPasswordInput) {
  const supabase = createClient();

  return supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: buildAuthRedirect("/auth/callback?next=/update-password"),
  });
}

export async function updatePassword({ password }: UpdatePasswordInput) {
  const supabase = createClient();
  return supabase.auth.updateUser({ password });
}
