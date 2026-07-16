import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <div>
      <p className="gc-eyebrow">أهلاً برجوعك</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">سجّل دخول وابدأ تمرينك.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">جدولك وتمرينتك والجروب مستنيينك.</p>
      <LoginForm />
    </div>
  );
}
