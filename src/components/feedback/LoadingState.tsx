export interface LoadingStateProps {
  label?: string;
}

/** Minimal placeholder loading indicator used while data is being fetched. */
export function LoadingState({ label = "Loading…" }: LoadingStateProps) {
  return (
    <div className="flex items-center justify-center p-8 text-sm opacity-70" role="status">
      {label}
    </div>
  );
}
