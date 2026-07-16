import { JoinGroupForm } from "@/features/onboarding/components/JoinGroupForm";

export default function JoinGroupPage() {
  return (
    <div>
      <p className="gc-eyebrow">إعداد الجروب</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">ادخل مع صحابك.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">اكتب كود الدعوة زي ما صاحب الجروب بعتهولك بالظبط.</p>
      <JoinGroupForm />
    </div>
  );
}
