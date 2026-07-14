export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

/** Minimal placeholder for a recoverable error within a section of a page. */
export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-8 text-center">
      <p className="font-medium">{title}</p>
      {description ? <p className="text-sm opacity-70">{description}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="text-sm underline">
          Try again
        </button>
      ) : null}
    </div>
  );
}
