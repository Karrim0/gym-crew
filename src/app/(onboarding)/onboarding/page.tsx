import Link from "next/link";
import { ArrowLeft, Dumbbell, Users } from "lucide-react";
import { SoloModeButton } from "@/features/onboarding/components/SoloModeButton";

export default function OnboardingPage() {
  return (
    <div>
      <p className="gc-eyebrow">اختار هتتمرّن إزاي</p>
      <h1 className="mt-2 text-3xl font-bold tracking-[-0.04em]">عايز تتمرّن إزاي؟</h1>
      <p className="mt-2 text-sm leading-6 text-neutral-400">
        اتمرّن لوحدك أو اعمل جروب. جدولك وأرقامك وإحصائياتك هيفضلوا خاصين بيك في الحالتين.
      </p>

      <div className="mt-7 space-y-3">
        <SoloModeButton />

        <Link href="/create-group" className="gc-card-interactive flex items-center gap-4 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-indigo-300/10 text-indigo-300">
            <Users className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">اعمل جروب</span>
            <span className="mt-0.5 block text-sm text-neutral-400">اعزم صحابك وشاركوا جدول أسبوعي أساسي.</span>
          </span>
          <ArrowLeft className="h-5 w-5 text-neutral-500" />
        </Link>

        <Link href="/join-group" className="gc-card-interactive flex items-center gap-4 p-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/[0.05] text-neutral-200">
            <Dumbbell className="h-5 w-5" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">ادخل بكود</span>
            <span className="mt-0.5 block text-sm text-neutral-400">اكتب كود الدعوة اللي صاحب الجروب بعتهولك.</span>
          </span>
          <ArrowLeft className="h-5 w-5 text-neutral-500" />
        </Link>
      </div>
    </div>
  );
}
