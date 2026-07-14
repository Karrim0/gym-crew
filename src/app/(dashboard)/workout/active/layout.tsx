import type { ReactNode } from "react";
import { StopwatchProvider } from "@/components/providers/StopwatchProvider";

/** Scopes the stopwatch to the active-workout route only (see StopwatchProvider). */
export default function ActiveWorkoutLayout({ children }: { children: ReactNode }) {
  return <StopwatchProvider>{children}</StopwatchProvider>;
}
