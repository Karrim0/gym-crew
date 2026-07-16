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
      className="gc-avatar-link relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-full"
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
