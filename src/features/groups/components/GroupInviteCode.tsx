"use client";

export interface GroupInviteCodeProps {
  inviteCode: string;
}

/** Minimal placeholder for displaying and copying a group's invite code. */
export function GroupInviteCode({ inviteCode }: GroupInviteCodeProps) {
  return (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <span className="font-mono tracking-widest">{inviteCode}</span>
      <button
        type="button"
        onClick={() => navigator.clipboard?.writeText(inviteCode)}
        className="text-xs underline"
      >
        Copy
      </button>
    </div>
  );
}
