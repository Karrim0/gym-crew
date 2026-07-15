"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { signOut } from "../services/auth.service";
import { clearPrivatePageCache } from "@/lib/pwa/service-worker-messages";
import { clearAllLocalPrivateData } from "@/lib/offline";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  async function handleLogout() {
    setIsPending(true);
    const { error } = await signOut();
    if (error) {
      setIsPending(false);
      return;
    }
    await Promise.all([clearPrivatePageCache(), clearAllLocalPrivateData()]);
    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending} className="grid h-9 w-9 place-items-center rounded-full border border-white/[0.07] bg-white/[0.035] text-neutral-400 transition hover:text-white disabled:opacity-50" aria-label="Log out">
      <LogOut className="h-4 w-4" />
    </button>
  );
}
