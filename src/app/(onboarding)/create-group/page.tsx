import { CreateGroupForm } from "@/features/onboarding/components/CreateGroupForm";

export default function CreateGroupPage() {
  return (
    <div>
      <p className="gc-eyebrow">إعداد الجروب</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">اعمل الجروب بتاعك.</h1>
      <p className="mb-7 mt-2 text-sm leading-6 text-neutral-400">إنت هتبقى صاحب الجروب وتقدر تعزم صحابك بكود.</p>
      <CreateGroupForm />
    </div>
  );
}
