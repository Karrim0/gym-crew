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
    <header className="sticky top-0 z-30 border-b border-white/[0.055] bg-[#0b0d13]/90 px-4 py-3 backdrop-blur-2xl sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          {showBackButton ? <BackButton /> : null}
          <h1 className="truncate text-lg font-bold tracking-[-0.015em] text-white sm:text-xl">{title}</h1>
        </div>
        <div className="flex items-center gap-2">{actions}<SyncStatusIndicator /></div>
      </div>
    </header>
  );
}
