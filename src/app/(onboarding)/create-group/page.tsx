import { CreateGroupForm } from "@/features/onboarding/components/CreateGroupForm";

export default function CreateGroupPage() {
  return (
    <div>
      <p className="gc-eyebrow">Crew setup</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Create your group.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">You will be the owner and can invite friends with a code.</p>
      <CreateGroupForm />
    </div>
  );
}
