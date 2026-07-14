import { JoinGroupForm } from "@/features/onboarding/components/JoinGroupForm";

export default function JoinGroupPage() {
  return (
    <div>
      <p className="gc-eyebrow">Crew setup</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Join your friends.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">Paste the invite code exactly as your group owner shared it.</p>
      <JoinGroupForm />
    </div>
  );
}
