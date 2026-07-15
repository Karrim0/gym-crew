import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div>
      <p className="gc-eyebrow">Almost done</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">Choose a new password.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">Use something strong and unique for your account.</p>
      <UpdatePasswordForm />
    </div>
  );
}
