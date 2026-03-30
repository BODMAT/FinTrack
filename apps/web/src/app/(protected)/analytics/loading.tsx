export default function AnalyticsLoading() {
  return (
    <section className="w-full">
      <div className="mb-6 h-10 w-56 animate-pulse rounded bg-[var(--color-card)]" />

      <div className="flex flex-col gap-6 pb-28">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`max-w-[70%] rounded border-1 border-[var(--color-fixed-text)] px-5 py-4 ${
              index % 2 === 0
                ? "ml-auto w-[65%] animate-pulse bg-[var(--color-card)]"
                : "w-[70%] animate-pulse bg-[var(--color-card)]"
            }`}
          >
            <div className="h-4 w-full rounded bg-[var(--color-main)] opacity-40" />
          </div>
        ))}
      </div>

      <div className="fixed bottom-5 left-[320px] w-[calc(100%-340px)] rounded-2xl border-2 border-[var(--color-fixed-text)] bg-[var(--color-card)] px-3 py-2 shadow-lg max-md:left-5 max-md:w-[calc(100%-40px)]">
        <div className="flex items-center gap-6">
          <div className="h-12 flex-1 animate-pulse rounded-[5px] bg-[var(--color-main)] opacity-40" />
          <div className="h-12 w-[120px] animate-pulse rounded-[10px] bg-[var(--color-main)] opacity-40" />
        </div>
      </div>
    </section>
  );
}
