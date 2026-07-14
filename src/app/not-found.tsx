import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-2 p-8 text-center">
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link href="/dashboard" className="text-sm underline">
        Back to dashboard
      </Link>
    </div>
  );
}
