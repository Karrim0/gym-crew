import type { ReactNode } from "react";
import { BottomNavigation } from "@/components/navigation/BottomNavigation";
import { DesktopSidebar } from "@/components/navigation/DesktopSidebar";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Top-level shell for authenticated dashboard routes: sidebar on larger
 * viewports, bottom navigation on mobile. Minimal placeholder markup only —
 * no finished visual design yet.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <DesktopSidebar />
      <div className="flex flex-1 flex-col">
        <OfflineBanner />
        <main className="flex-1 pb-16 md:pb-0">{children}</main>
        <BottomNavigation />
      </div>
    </div>
  );
}
