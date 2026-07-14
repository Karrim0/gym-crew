"use client";

import { ErrorState } from "@/components/feedback/ErrorState";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <ErrorState
          title="Something went wrong"
          description={error.message}
          onRetry={reset}
        />
      </body>
    </html>
  );
}
