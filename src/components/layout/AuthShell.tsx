import type { ReactNode } from "react";
import { APP_CONFIG } from "@/config/app";

export interface AuthShellProps {
  children: ReactNode;
}

/** Minimal centered shell used by the (auth) route group. */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center p-4">
      <p className="mb-6 text-lg font-semibold">{APP_CONFIG.name}</p>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
