export function Spinner() {
  return (
    <div className="flex p-[12px] justify-center items-center">
      <div
        className="h-[40px] w-[40px] animate-spin rounded-full border-4 border-(--color-fixed-text) border-t-transparent"
        aria-label="Loading"
      />
    </div>
  );
}
