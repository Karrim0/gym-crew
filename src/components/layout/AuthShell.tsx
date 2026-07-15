import type { ReactNode } from "react";
import { Dumbbell, ShieldCheck, WifiOff } from "lucide-react";
import { APP_CONFIG } from "@/config/app";

export interface AuthShellProps {
  children: ReactNode;
}

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_15%_15%,rgba(139,158,255,.12),transparent_25rem),radial-gradient(circle_at_90%_80%,rgba(16,185,129,.08),transparent_28rem)]" />
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/[0.08] bg-[#0d110e]/92 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl lg:grid-cols-[1.05fr_.95fr]">
        <section className="hidden min-h-[640px] flex-col justify-between border-r border-white/[0.07] bg-[linear-gradient(145deg,rgba(139,158,255,.12),rgba(255,255,255,.025))] p-10 lg:flex">
          <div>
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-300 text-neutral-950">
                <Dumbbell className="h-6 w-6" />
              </span>
              <div>
                <p className="text-xl font-bold tracking-[-0.03em]">{APP_CONFIG.name}</p>
                <p className="gc-eyebrow mt-0.5">Train. Track. Repeat.</p>
              </div>
            </div>
            <h2 className="mt-20 max-w-md text-5xl font-bold leading-[1.02] tracking-[-0.055em]">
              Your whole gym week, without the spreadsheet chaos.
            </h2>
            <p className="mt-5 max-w-lg text-base leading-7 text-neutral-400">
              Log sets fast, keep your rest timer alive, see real progress and train with your crew from one focused app.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <WifiOff className="h-5 w-5 text-indigo-300" />
              <p className="mt-3 font-bold">Offline first</p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">Keep logging even with weak gym Wi-Fi.</p>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-black/15 p-4">
              <ShieldCheck className="h-5 w-5 text-indigo-300" />
              <p className="mt-3 font-bold">Private by default</p>
              <p className="mt-1 text-xs leading-5 text-neutral-400">You control what your crew can see.</p>
            </div>
          </div>
        </section>

        <section className="flex min-h-[600px] items-center p-5 sm:p-8 lg:p-10">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-indigo-300 text-neutral-950">
                <Dumbbell className="h-5 w-5" />
              </span>
              <div>
                <p className="text-lg font-bold">{APP_CONFIG.name}</p>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-neutral-500">Built for gym mode</p>
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
