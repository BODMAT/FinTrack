export default function TransactionsLoading() {
  return (
    <section className="w-full">
      <div className="mb-[27px] flex items-center justify-between gap-[24px] max-[970px]:flex-col">
        <div className="h-[40px] w-[224px] animate-pulse rounded bg-(--color-card)" />
        <div className="flex gap-[12px] max-[400px]:flex-col">
          <div className="h-[46px] w-[300px] animate-pulse rounded-[10px] bg-(--color-card)" />
          <div className="h-[46px] w-[110px] animate-pulse rounded-[10px] bg-(--color-card)" />
        </div>
      </div>
      <div className="flex flex-col gap-[16px]">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[72px] w-full animate-pulse rounded border border-(--color-fixed-text) bg-(--color-card)"
          />
        ))}
      </div>
    </section>
  );
}



