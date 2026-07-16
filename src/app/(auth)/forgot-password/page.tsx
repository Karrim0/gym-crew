import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div>
      <p className="gc-eyebrow">استرجاع الحساب</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">غيّر الباسورد بتاعك.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">هنبعتلك لينك آمن على الإيميل عشان تغيّر الباسورد.</p>
      <ForgotPasswordForm />
    </div>
  );
}
