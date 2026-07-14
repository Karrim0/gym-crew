"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface GroupInviteCodeProps { inviteCode: string }

export function GroupInviteCode({ inviteCode }: GroupInviteCodeProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard?.writeText(inviteCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border bg-neutral-50 p-3 dark:bg-neutral-900">
      <span className="font-mono text-lg font-bold tracking-[0.25em]">{inviteCode}</span>
      <button type="button" onClick={() => void copy()} className="inline-flex items-center gap-1 rounded-lg border bg-white px-3 py-2 text-xs font-semibold dark:bg-neutral-950">
        {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
