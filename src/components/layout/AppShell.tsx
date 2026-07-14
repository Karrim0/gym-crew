import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { RestTimerLauncher } from "@/features/workouts/components/RestTimerPanel";

export interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="gc-shell flex min-h-dvh flex-col md:flex-row">
      <DesktopSidebar />
      <div className="relative flex min-w-0 flex-1 flex-col md:ml-[17.5rem]">
        <OfflineBanner />
        <main className="relative flex-1 pb-28 md:pb-8">{children}</main>
        <BottomNavigation />
        <RestTimerLauncher />
      </div>
    </div>
  );
}
