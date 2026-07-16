"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";
import { APP_CONFIG } from "@/config/app";

export function DesktopSidebar() {
  const pathname = usePathname();

  if (pathname.startsWith("/workout/active")) return null;

  return (
    <aside className="gc-desktop-sidebar gc-navigation-surface fixed inset-y-0 z-40 hidden w-[16.5rem] flex-col p-4 md:flex">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="gc-brand-mark grid h-10 w-10 place-items-center rounded-xl"><Dumbbell className="h-5 w-5" /></span>
        <span className="min-w-0"><span className="block truncate text-lg font-bold tracking-[-0.02em]">{APP_CONFIG.name}</span><span className="gc-muted block text-[11px] font-semibold">تمرينك الشخصي أولاً</span></span>
      </Link>

      <nav className="mt-7 flex flex-col gap-1.5" aria-label="التنقل الرئيسي">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
            && !(item.id === "workout" && pathname.startsWith("/workout/history"));
          return (
            <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={`gc-side-nav-item ${active ? "gc-side-nav-item-active" : ""}`}>
              <Icon className="h-5 w-5" aria-hidden /> <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="gc-sidebar-tip mt-auto p-4">
        <p className="text-sm font-semibold">كل حاجة في مكانها</p>
        <p className="gc-muted mt-1 text-xs leading-5">رتّب أسبوعك، افتح تمرينة النهارده، العب وسجّل، وبعدها راجع تقدمك.</p>
      </div>
    </aside>
  );
}
