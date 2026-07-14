import type { ReactNode } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { SyncStatusIndicator } from "@/components/feedback/SyncStatusIndicator";

export interface DashboardHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: ReactNode;
}

/** Minimal shared header used across dashboard pages. */
export function DashboardHeader({ title, showBackButton, actions }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-2 p-4">
      <div className="flex items-center gap-2">
        {showBackButton ? <BackButton /> : null}
        <h1 className="text-lg font-semibold">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        {actions}
        <SyncStatusIndicator />
      </div>
    </header>
  );
}
