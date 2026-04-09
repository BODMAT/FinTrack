export default function AnalyticsLoading() {
  return (
    <section className="w-full">
      <div className="mb-[24px] h-[40px] w-[224px] animate-pulse rounded bg-(--color-card)" />

      <div className="flex flex-col gap-[24px] pb-[112px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`max-w-[70%] rounded border border-(--color-fixed-text) px-[20px] py-[16px] ${
              index % 2 === 0
                ? "ml-auto w-[65%] animate-pulse bg-(--color-card)"
                : "w-[70%] animate-pulse bg-(--color-card)"
            }`}
          >
            <div className="h-[16px] w-full rounded bg-(--color-main) opacity-40" />
          </div>
        ))}
      </div>

      <div className="fixed bottom-[20px] left-[320px] w-[calc(100%-340px)] rounded-[8px]xl border-2 border-(--color-fixed-text) bg-(--color-card) px-[12px] py-[8px] shadow-lg max-md:left-[20px] max-md:w-[calc(100%-40px)]">
        <div className="flex items-center gap-[24px]">
          <div className="h-[48px] flex-1 animate-pulse rounded-[5px] bg-(--color-main) opacity-40" />
          <div className="h-[48px] w-[120px] animate-pulse rounded-[10px] bg-(--color-main) opacity-40" />
        </div>
      </div>
    </section>
  );
}
