"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export interface GroupInviteCodeProps { inviteCode: string }

export function GroupInviteCode({ inviteCode }: GroupInviteCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  async function share() {
    const text = `Join my Gym Crew with code ${inviteCode}`;
    if (navigator.share) await navigator.share({ title: "Gym Crew invite", text });
    else await copy();
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border bg-neutral-50 p-3 dark:bg-neutral-900">
      <span className="min-w-0 flex-1 truncate font-mono text-lg font-black tracking-[0.22em]">{inviteCode}</span>
      <button type="button" onClick={() => void share()} className="rounded-lg border bg-white p-2.5 dark:bg-neutral-950" aria-label="Share invite"><Share2 className="h-4 w-4" /></button>
      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2.5 text-xs font-bold dark:bg-neutral-950">{copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}{copied ? "Copied" : "Copy"}</button>
    </div>
  );
}
