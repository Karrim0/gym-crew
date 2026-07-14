/**
 * Generates a client-side UUID. Used as `clientId` on records created while
 * offline so the eventual sync to Supabase is idempotent — replaying the
 * same mutation twice (e.g. after a retry) must not create duplicate rows.
 */
export function generateClientId(): string {
  return crypto.randomUUID();
}
