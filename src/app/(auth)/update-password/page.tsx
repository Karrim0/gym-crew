import { UpdatePasswordForm } from "@/features/auth/components/UpdatePasswordForm";

export default function UpdatePasswordPage() {
  return (
    <div>
      <p className="gc-eyebrow">فاضل خطوة</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">اختار باسورد جديد.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">اختار باسورد قوي ومختلف لحسابك.</p>
      <UpdatePasswordForm />
    </div>
  );
}
