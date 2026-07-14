import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

/** Minimal shared content-width wrapper used inside page bodies. */
export function PageContainer({ children, className }: PageContainerProps) {
  return <div className={cn("mx-auto w-full max-w-2xl px-4", className)}>{children}</div>;
}
