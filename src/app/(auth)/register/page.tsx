import { RegisterForm } from "@/features/auth/components/RegisterForm";

export default function RegisterPage() {
  return (
    <div>
      <p className="gc-eyebrow">Start training</p>
      <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Create your Gym Crew account.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">Go solo or bring your friends. Your personal progress stays yours.</p>
      <RegisterForm />
    </div>
  );
}
