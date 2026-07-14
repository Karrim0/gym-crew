/**
 * Centralized, validated access to environment variables.
 *
 * Import `env` instead of reading `process.env` directly so that a missing
 * variable fails fast with a clear error instead of surfacing as a confusing
 * runtime bug deep inside Supabase client code.
 */

function requireEnv(name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new Error(
      `Missing required environment variable: ${name}. Copy .env.example to .env.local and fill it in.`
    );
  }
  return value;
}

export const env = {
  supabase: {
    url: () => requireEnv("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: () =>
      requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    /**
     * Non-throwing check for call sites that must degrade gracefully
     * instead of crashing — namely `src/proxy.ts`, which runs on every
     * request. Everywhere else should prefer `env.supabase.url()` /
     * `anonKey()` so a genuine misconfiguration fails loudly.
     */
    isConfigured: () =>
      Boolean(
        process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
      ),
  },
} as const;
