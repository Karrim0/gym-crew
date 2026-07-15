import type { LucideIcon } from "lucide-react";
import { ChartNoAxesCombined, Dumbbell, House, Rows3, Users } from "lucide-react";

export interface NavigationItem {
  id: "home" | "split" | "workout" | "crew" | "progress";
  label: string;
  href: string;
  icon: LucideIcon;
  activePrefixes: readonly string[];
}

export const MAIN_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: "home", label: "Home", href: "/dashboard", icon: House, activePrefixes: ["/dashboard"] },
  { id: "split", label: "My split", href: "/split/personal", icon: Rows3, activePrefixes: ["/split"] },
  { id: "workout", label: "Workout", href: "/workout/today", icon: Dumbbell, activePrefixes: ["/workout"] },
  { id: "crew", label: "Crew", href: "/group", icon: Users, activePrefixes: ["/group"] },
  { id: "progress", label: "Progress", href: "/progress", icon: ChartNoAxesCombined, activePrefixes: ["/progress", "/workout/history"] },
];
