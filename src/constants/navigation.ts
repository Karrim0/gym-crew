import type { LucideIcon } from "lucide-react";
import { CalendarCheck, Dumbbell, TrendingUp, Users, User } from "lucide-react";

export interface NavigationItem {
  /** English internal identifier, stable across locales. */
  id: "dashboard" | "workout" | "progress" | "group" | "profile";
  /** User-facing label. Kept as a single string today; swap for a lookup
   * keyed by `id` once Arabic localization is added, rather than hard-coding
   * translated strings throughout components. */
  label: string;
  href: string;
  icon: LucideIcon;
}

/** Primary bottom navigation shown on mobile and mirrored in the desktop sidebar. */
export const MAIN_NAVIGATION_ITEMS: readonly NavigationItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: CalendarCheck },
  { id: "workout", label: "Workout", href: "/workout", icon: Dumbbell },
  { id: "progress", label: "Progress", href: "/progress", icon: TrendingUp },
  { id: "group", label: "Group", href: "/group", icon: Users },
  { id: "profile", label: "Profile", href: "/profile", icon: User },
];
