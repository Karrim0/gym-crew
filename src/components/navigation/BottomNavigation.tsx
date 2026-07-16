"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";
import { useVirtualKeyboard } from "@/hooks/use-virtual-keyboard";

export function BottomNavigation() {
  const pathname = usePathname();
  const keyboardOpen = useVirtualKeyboard();

  if (pathname.startsWith("/workout/active") || keyboardOpen) return null;

  return (
    <nav className="gc-bottom-nav fixed z-50 mx-auto max-w-lg rounded-[20px] border border-white/10 bg-[#131620]/96 p-1.5 shadow-[0_20px_60px_rgba(0,0,0,.5)] backdrop-blur-2xl md:hidden" aria-label="Primary navigation">
      <div className="grid grid-cols-5 gap-1">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)) && !(item.id === "workout" && pathname.startsWith("/workout/history"));
          const isWorkout = item.id === "workout";
          return <Link key={item.id} href={item.href} aria-current={active ? "page" : undefined} className={`relative flex min-h-[3.45rem] flex-col items-center justify-center gap-1 rounded-[15px] px-1 text-[10px] font-semibold transition ${isWorkout ? "bg-indigo-300 text-[#11131a] shadow-lg shadow-indigo-500/10" : active ? "bg-white/[0.07] text-indigo-200" : "text-neutral-500 hover:text-neutral-200"}`}><Icon className={`h-5 w-5 ${active || isWorkout ? "stroke-[2.4]" : ""}`} aria-hidden /><span>{item.label}</span></Link>;
        })}
      </div>
    </nav>
  );
}
