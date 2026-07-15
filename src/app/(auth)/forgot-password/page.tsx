import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="gc-eyebrow">Account recovery</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Reset your password.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">We will send a secure reset link to your email.</p>
      <ForgotPasswordForm />
    </div>
  );
}
