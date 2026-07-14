"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";

export function BottomNavigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-3 bottom-3 z-50 mx-auto max-w-lg rounded-[24px] border border-white/10 bg-[#0d110e]/94 p-1.5 pb-[max(.4rem,env(safe-area-inset-bottom))] shadow-[0_24px_70px_rgba(0,0,0,.58)] backdrop-blur-2xl md:hidden">
      <div className="grid grid-cols-5 gap-1">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isWorkout = item.id === "workout";

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`relative flex min-h-[3.65rem] flex-col items-center justify-center gap-1 rounded-[18px] px-1 text-[10px] font-black transition ${
                isWorkout
                  ? "bg-lime-300 text-neutral-950 shadow-lg shadow-lime-500/10"
                  : active
                    ? "bg-white/[0.07] text-lime-300"
                    : "text-neutral-500 hover:text-neutral-200"
              }`}
            >
              <Icon className={`h-5 w-5 ${active || isWorkout ? "stroke-[2.6]" : ""}`} aria-hidden />
              <span>{item.label}</span>
              {active && !isWorkout ? <span className="absolute bottom-1 h-1 w-1 rounded-full bg-lime-300" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
