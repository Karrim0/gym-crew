import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

/**
 * Cross-feature Supabase Realtime helper. Lives at the root `services/`
 * layer (rather than inside a single feature) because both the `groups`
 * feature (activity feed) and `dashboard` feature (live adherence/streak
 * updates) subscribe to the same underlying group-activity channel.
 *
 * Feature-specific realtime needs should still prefer a feature service that
 * calls this helper over subscribing to Supabase directly, so channel
 * naming and cleanup stay consistent.
 */
export function subscribeToGroupActivity(
  groupId: string,
  onInsert: (payload: unknown) => void
): RealtimeChannel {
  const supabase = createClient();

  return supabase
    .channel(`group-activity:${groupId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "group_activity", filter: `group_id=eq.${groupId}` },
      (payload) => onInsert(payload.new)
    )
    .subscribe();
}

export function unsubscribeFromChannel(channel: RealtimeChannel): void {
  void channel.unsubscribe();
}
