interface AuthSubmitMessageProps {
  message: string | null;
  tone?: "error" | "success";
}

export function AuthSubmitMessage({ message, tone = "error" }: AuthSubmitMessageProps) {
  if (!message) return null;

  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      aria-live="polite"
      className={tone === "error" ? "text-sm text-red-600" : "text-sm text-green-700"}
    >
      {message}
    </p>
  );
}
