import Link from "next/link";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";
import { APP_CONFIG } from "@/config/app";

/** Minimal desktop sidebar navigation. Hidden on small viewports via CSS (see AppShell). */
export function DesktopSidebar() {
  return (
    <aside className="hidden w-56 shrink-0 flex-col gap-4 border-r p-4 md:flex">
      <p className="font-semibold">{APP_CONFIG.name}</p>
      <nav className="flex flex-col gap-2">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.id} href={item.href} className="flex items-center gap-2 text-sm">
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
