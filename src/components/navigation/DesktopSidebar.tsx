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
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[16.5rem] flex-col border-r border-white/[0.06] bg-[#0d0f16]/92 p-4 backdrop-blur-2xl md:flex">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-xl px-2 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-300 text-[#11131a]"><Dumbbell className="h-5 w-5" /></span>
        <span><span className="block text-lg font-bold tracking-[-0.02em]">{APP_CONFIG.name}</span><span className="text-[11px] font-semibold text-neutral-500">Personal training first</span></span>
      </Link>

      <nav className="mt-7 flex flex-col gap-1.5" aria-label="Desktop navigation">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
            && !(item.id === "workout" && pathname.startsWith("/workout/history"));
          return (
            <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={`flex min-h-11 items-center gap-3 rounded-xl px-3.5 text-sm font-semibold transition ${active ? "bg-indigo-300 text-[#11131a]" : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"}`}>
              <Icon className="h-5 w-5" aria-hidden /> {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-xl border border-white/[0.06] bg-white/[0.025] p-4">
        <p className="text-sm font-semibold">Simple order</p>
        <p className="mt-1 text-xs leading-5 text-neutral-500">Plan your week, open today&apos;s session, train, then review progress.</p>
      </div>
    </aside>
  );
}
