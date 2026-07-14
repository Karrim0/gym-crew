"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "../services/auth.service";

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

    router.replace("/login");
    router.refresh();
  }

  return (
    <button type="button" onClick={handleLogout} disabled={isPending} className="rounded-md border px-3 py-1.5 text-sm">
      {isPending ? "Logging out…" : "Log out"}
    </button>
  );
}
