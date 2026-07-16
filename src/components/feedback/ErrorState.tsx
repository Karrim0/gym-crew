import { AlertTriangle, RotateCcw } from "lucide-react";

export interface ErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
}

export function ErrorState({ title = "حصلت مشكلة", description, onRetry }: ErrorStateProps) {
  return (
    <div className="flex min-h-[60dvh] items-center justify-center p-4">
      <div className="gc-card w-full max-w-md p-6 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-400/10 text-red-300"><AlertTriangle className="h-7 w-7" /></span>
        <p className="mt-4 text-xl font-bold">{title}</p>
        {description ? <p className="mt-2 text-sm leading-6 text-neutral-500">{description}</p> : null}
        {onRetry ? <button type="button" onClick={onRetry} className="gc-primary-button mt-5 w-full"><RotateCcw className="h-4 w-4" /> جرّب تاني</button> : null}
      </div>
    </div>
  );
}
