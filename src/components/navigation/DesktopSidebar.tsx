"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dumbbell, Sparkles } from "lucide-react";
import { MAIN_NAVIGATION_ITEMS } from "@/constants/navigation";
import { APP_CONFIG } from "@/config/app";

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-[17.5rem] flex-col border-r border-white/[0.07] bg-[#090c09]/88 p-4 backdrop-blur-2xl md:flex">
      <Link href="/dashboard" className="flex items-center gap-3 rounded-2xl px-2 py-2">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-lime-300 text-neutral-950 shadow-lg shadow-lime-400/10">
          <Dumbbell className="h-6 w-6" />
        </span>
        <span>
          <span className="block text-lg font-black tracking-[-0.03em]">{APP_CONFIG.name}</span>
          <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">Train together</span>
        </span>
      </Link>

      <nav className="mt-7 flex flex-col gap-1.5">
        {MAIN_NAVIGATION_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.id}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group flex min-h-12 items-center gap-3 rounded-2xl px-3.5 text-sm font-black transition ${
                active
                  ? "bg-lime-300 text-neutral-950 shadow-lg shadow-lime-500/10"
                  : "text-neutral-400 hover:bg-white/[0.05] hover:text-white"
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? "stroke-[2.7]" : "group-hover:stroke-[2.4]"}`} aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[22px] border border-lime-300/15 bg-lime-300/[0.055] p-4">
        <Sparkles className="h-5 w-5 text-lime-300" />
        <p className="mt-3 font-black">Built for gym mode</p>
        <p className="mt-1 text-xs leading-5 text-neutral-400">Quick sets, rest timer, offline sync and crew progress in one place.</p>
      </div>
    </aside>
  );
}
