import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center p-4 text-center">
      <section className="gc-card w-full max-w-md p-7">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-[22px] bg-lime-300/10 text-lime-300"><SearchX className="h-8 w-8" /></span>
        <p className="gc-eyebrow mt-5">404</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.04em]">Page not found</h1>
        <p className="mt-2 text-sm leading-6 text-neutral-500">This route does not exist or may have moved.</p>
        <Link href="/dashboard" className="gc-primary-button mt-6 w-full"><ArrowLeft className="h-4 w-4" /> Back to dashboard</Link>
      </section>
    </main>
  );
}
