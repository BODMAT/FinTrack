export default function TransactionsLoading() {
  return (
    <section className="w-full">
      <div className="mb-[27px] flex items-center justify-between gap-6 max-[970px]:flex-col">
        <div className="h-10 w-56 animate-pulse rounded bg-[var(--color-card)]" />
        <div className="flex gap-3 max-[400px]:flex-col">
          <div className="h-[46px] w-[300px] animate-pulse rounded-[10px] bg-[var(--color-card)]" />
          <div className="h-[46px] w-[110px] animate-pulse rounded-[10px] bg-[var(--color-card)]" />
        </div>
      </div>
      <div className="flex flex-col gap-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[72px] w-full animate-pulse rounded border border-[var(--color-fixed-text)] bg-[var(--color-card)]"
          />
        ))}
      </div>
    </section>
  );
}

