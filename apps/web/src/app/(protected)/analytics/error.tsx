"use client";

interface AnalyticsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AnalyticsError({ error, reset }: AnalyticsErrorProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-4 rounded-[10px] border-1 border-[var(--color-fixed-text)] p-6 text-center">
      <h2 className="text-[24px] font-semibold text-[var(--color-title)]">
        Failed to load analytics
      </h2>
      <p className="max-w-[560px] text-[var(--color-text)]">
        {error.message || "Unexpected error happened while loading analytics."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-[10px] border-1 border-[var(--color-fixed-text)] px-4 py-2 font-semibold text-[var(--color-text)] transition hover:border-[var(--color-hover)] hover:text-[var(--color-hover)]"
      >
        Retry
      </button>
    </div>
  );
}
