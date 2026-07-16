import Link from "next/link";
import { ChevronLeft, Users, UserRound } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function SplitPage() {
  return (
    <>
      <DashboardHeader title="الجدول" />
      <PageContainer className="grid gap-3 pb-8">
        <Link href="/split/personal" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><UserRound className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold">جدولي</span><span className="text-sm text-neutral-500">أيام الراحة وتمارينك الشخصية</span></span><ChevronLeft className="h-5 w-5" /></Link>
        <Link href="/split/group" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Users className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold">جدول الجروب</span><span className="text-sm text-neutral-500">الجدول المشترك بتاع الجروب</span></span><ChevronLeft className="h-5 w-5" /></Link>
      </PageContainer>
    </>
  );
}
