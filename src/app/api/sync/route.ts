import { NextResponse } from "next/server";

/**
 * Placeholder endpoint for offline mutation sync. Once implemented, this
 * will accept a batch of queued `OfflineMutation` items (see
 * `src/types/domain.ts`) and apply them idempotently using each item's
 * `clientId`. Returns 501 until that logic is built — see
 * docs/OFFLINE_SYNC.md.
 */
export async function POST() {
  return NextResponse.json(
    { error: "Sync endpoint not implemented yet." },
    { status: 501 }
  );
}
