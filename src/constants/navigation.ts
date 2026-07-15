import type { LucideIcon } from "lucide-react";
import { ChartNoAxesCombined, CircleUserRound, Dumbbell, House, Rows3 } from "lucide-react";

export interface NavigationItem {
  id: "home" | "plan" | "train" | "progress" | "more";
  label: string;
  href: string;
  icon: LucideIcon;
  activePrefixes: readonly string[];
}

export const MAIN_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/dashboard", icon: House, activePrefixes: ["/dashboard"] },
  { id: "plan", label: "Plan", href: "/split/personal", icon: Rows3, activePrefixes: ["/split"] },
  { id: "train", label: "Train", href: "/workout/today", icon: Dumbbell, activePrefixes: ["/workout/today", "/workout/active"] },
  { id: "progress", label: "Progress", href: "/progress", icon: ChartNoAxesCombined, activePrefixes: ["/progress"] },
  { id: "more", label: "More", href: "/more", icon: CircleUserRound, activePrefixes: ["/more", "/profile", "/group", "/workout/history"] },
];
