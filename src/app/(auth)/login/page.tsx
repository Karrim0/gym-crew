import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <p className="gc-eyebrow">Welcome back</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Log in and get moving.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">Your split, active workout and crew are waiting.</p>
      <LoginForm />
    </div>
  );
}
