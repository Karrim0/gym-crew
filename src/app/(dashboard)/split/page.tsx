import Link from "next/link";
import { ChevronRight, Users, UserRound } from "lucide-react";
import { DashboardHeader } from "@/components/layout/DashboardHeader";
import { PageContainer } from "@/components/layout/PageContainer";

export default function SplitPage() {
  return (
    <>
      <DashboardHeader title="Split" />
      <PageContainer className="grid gap-3 pb-8">
        <Link href="/split/personal" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><UserRound className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold">My split</span><span className="text-sm text-neutral-500">Rest days and personal exercises</span></span><ChevronRight className="h-5 w-5" /></Link>
        <Link href="/split/group" className="flex items-center gap-3 rounded-2xl border bg-white p-4 dark:bg-neutral-950"><span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 dark:bg-neutral-800"><Users className="h-5 w-5" /></span><span className="flex-1"><span className="block font-bold">Group split</span><span className="text-sm text-neutral-500">The shared PPL template</span></span><ChevronRight className="h-5 w-5" /></Link>
      </PageContainer>
    </>
  );
}
