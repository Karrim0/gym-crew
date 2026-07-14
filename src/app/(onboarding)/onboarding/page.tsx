import Link from "next/link";
import { SoloModeButton } from "@/features/onboarding/components/SoloModeButton";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-xl font-semibold">Welcome to Gym Crew</h1>
      <p className="text-sm opacity-70">
        Choose a private solo workspace or start with a crew. Your personal split and progress stay at the center either way.
      </p>
      <div className="flex flex-col gap-2">
        <SoloModeButton />
        <div className="my-1 flex items-center gap-3 text-xs uppercase tracking-wide text-neutral-400">
          <span className="h-px flex-1 bg-current" /> or train with friends <span className="h-px flex-1 bg-current" />
        </div>
        <Link href="/create-group" className="rounded-md border p-2 font-medium">
          Create a group
        </Link>
        <Link href="/join-group" className="rounded-md border p-2 font-medium">
          Join a group
        </Link>
      </div>
    </div>
  );
}
