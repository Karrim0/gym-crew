"use client";

import { ErrorState } from "@/components/feedback/ErrorState";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl" className="dark h-full">
      <body className="min-h-full bg-[#0b0d13] text-white">
        <ErrorState title="حصلت مشكلة في Gym Crew" description={error.message} onRetry={reset} />
      </body>
    </html>
  );
}
