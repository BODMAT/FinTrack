"use client";

interface TransactionsErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TransactionsError({
  error,
  reset,
}: TransactionsErrorProps) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center gap-[16px] rounded-[10px] border border-(--color-fixed-text) p-[24px] text-center">
      <h2 className="text-[24px] font-semibold text-(--color-title)">
        Failed to load transactions
      </h2>
      <p className="max-w-[560px] text-(--color-text)">
        {error.message || "Unexpected error happened while loading transactions."}
      </p>
      <button
        type="button"
        onClick={reset}
        className="rounded-[10px] border border-(--color-fixed-text) px-[16px] py-[8px] font-semibold text-(--color-text) transition hover:border-(--color-hover) hover:text-(--color-hover)"
      >
        Retry
      </button>
    </div>
  );
}



