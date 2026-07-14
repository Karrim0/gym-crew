import Link from "next/link";
import { ArrowRight, Dumbbell, Users } from "lucide-react";
import { SoloModeButton } from "@/features/onboarding/components/SoloModeButton";

export default function OnboardingPage() {
  return (
    <div>
      <p className="gc-eyebrow">Choose your setup</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">How do you want to train?</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        Start solo or build a crew. Your personal split, records and analytics stay independent either way.
      </p>

      <div className="mt-7 space-y-3">
        <SoloModeButton />

        <Link href="/create-group" className="gc-card-interactive flex items-center gap-4 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-lime-300/10 text-lime-300">
            <Users className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">Create a crew</span>
            <span className="mt-0.5 block text-sm text-neutral-400">Invite friends and share a weekly base split.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-neutral-500" />
        </Link>

        <Link href="/join-group" className="gc-card-interactive flex items-center gap-4 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-neutral-200">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-black">Join with a code</span>
            <span className="mt-0.5 block text-sm text-neutral-400">Enter the invite code from your crew owner.</span>
          </span>
          <ArrowRight className="h-5 w-5 text-neutral-500" />
        </Link>
      </div>
    </div>
  );
}
