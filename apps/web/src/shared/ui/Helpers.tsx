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

export function ErrorCustom() {
  return (
    <div>
      <div className="flex p-[12px] justify-center items-center transitioned text-(--text-red) text-3xl">
        <h1>Error</h1>
      </div>
    </div>
  );
}

export function NoData() {
  return (
    <div>
      <div className="flex p-[12px] justify-center items-center transitioned text-(--text-red) text-3xl">
        <h1>No data</h1>
      </div>
    </div>
  );
}

export function CustomMessage({ message }: { message: string }) {
  return (
    <div>
      <div className="flex p-[12px] justify-center items-center transitioned text-(--color-text) text-2xl">
        <h1>{message}</h1>
      </div>
    </div>
  );
}
