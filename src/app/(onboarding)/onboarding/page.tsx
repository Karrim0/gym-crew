import Link from "next/link";

export default function OnboardingPage() {
  return (
    <div className="flex flex-col gap-4 text-center">
      <h1 className="text-xl font-semibold">Welcome to Gym Crew</h1>
      <p className="text-sm opacity-70">Create a new group or join one with an invite code.</p>
      <div className="flex flex-col gap-2">
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
