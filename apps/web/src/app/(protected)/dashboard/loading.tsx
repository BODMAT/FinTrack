export default function DashboardLoading() {
  return (
    <div className="w-full">
      <div className="mb-[27px] h-[40px] w-[224px] animate-pulse rounded bg-(--color-card)" />
      <div className="mb-[24px] flex flex-wrap gap-[18px]">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[170px] min-w-[240px] flex-1 animate-pulse rounded-[10px] border border-(--color-fixed-text) bg-(--color-card)"
          />
        ))}
      </div>
      <div className="flex gap-[18px] max-[1100px]:flex-col">
        <div className="h-[520px] flex-1 animate-pulse rounded-[10px] border border-(--color-fixed-text) bg-(--color-card)" />
        <div className="h-[520px] flex-1 animate-pulse rounded-[10px] border border-(--color-fixed-text) bg-(--color-card)" />
      </div>
    </div>
  );
}
