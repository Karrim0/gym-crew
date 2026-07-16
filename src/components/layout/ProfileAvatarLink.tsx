"use client";

import Link from "next/link";
import { useState } from "react";
import { CircleUserRound } from "lucide-react";

export interface ProfileAvatarLinkProps {
  avatarUrl: string | null;
  displayName: string;
}

export function ProfileAvatarLink({ avatarUrl, displayName }: ProfileAvatarLinkProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = Boolean(avatarUrl) && failedUrl !== avatarUrl;

  return (
    <Link
      href="/profile"
      className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/[0.1] bg-white/[0.045] text-neutral-300 shadow-[0_8px_24px_rgba(0,0,0,.2)] transition hover:border-indigo-300/35 hover:text-indigo-200"
      aria-label={`افتح بروفايل وإعدادات ${displayName}`}
      title="حسابي والإعدادات"
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatarUrl ?? undefined}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailedUrl(avatarUrl)}
        />
      ) : (
        <CircleUserRound className="h-5 w-5" aria-hidden />
      )}
    </Link>
  );
}
