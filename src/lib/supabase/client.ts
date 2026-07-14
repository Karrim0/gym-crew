"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function requirePublicEnv(
  name: string,
  value: string | undefined
): string {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        "Add it to .env.local and restart the development server."
    );
  }

  return normalizedValue;
}

export function createClient() {
  return createBrowserClient<Database>(
    requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_URL",
      supabaseUrl
    ),
    requirePublicEnv(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      supabaseAnonKey
    )
  );
}