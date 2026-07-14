import Link from "next/link";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";

/** Minimal mobile bottom navigation. Hidden on larger viewports via CSS (see AppShell). */
export function BottomNavigation() {
  return (
    <nav className="fixed inset-x-0 bottom-0 flex justify-around border-t p-2 md:hidden">
      {MAIN_NAVIGATION_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <Link key={item.id} href={item.href} className="flex flex-col items-center gap-1 text-xs">
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
