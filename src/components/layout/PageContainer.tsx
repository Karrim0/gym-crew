import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("mx-auto w-full max-w-6xl px-3.5 sm:px-6 lg:px-10", className)}>
      {children}
    </div>
  );
}
