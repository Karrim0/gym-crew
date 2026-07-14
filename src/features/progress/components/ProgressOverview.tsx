import type { ReactNode } from "react";

export interface ProgressOverviewProps {
  children?: ReactNode;
}

/** Minimal placeholder layout grouping the progress summary cards. */
export function ProgressOverview({ children }: ProgressOverviewProps) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}
