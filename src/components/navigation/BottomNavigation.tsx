"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-black/5 bg-white/92 px-2 pb-[max(.5rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.06)] backdrop-blur-xl dark:border-white/10 dark:bg-neutral-950/92 md:hidden">
      <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link key={item.id} href={item.href} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[10px] font-black transition ${active ? "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300" : "text-neutral-500"}`}>
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.5]" : ""}`} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
