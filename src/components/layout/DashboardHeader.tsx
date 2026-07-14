import type { ReactNode } from "react";
import { BackButton } from "@/components/navigation/BackButton";
import { SyncStatusIndicator } from "@/components/feedback/SyncStatusIndicator";

export interface DashboardHeaderProps {
  title: string;
  showBackButton?: boolean;
  actions?: ReactNode;
}

export function DashboardHeader({ title, showBackButton, actions }: DashboardHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-black/5 bg-background/90 px-4 py-3 backdrop-blur-xl dark:border-white/10">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {showBackButton ? <BackButton /> : null}
          <h1 className="truncate text-lg font-black tracking-tight">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <SyncStatusIndicator />
        </div>
      </div>
    </header>
  );
}
