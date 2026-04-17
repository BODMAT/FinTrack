export function CustomMessage({ message }: { message: string }) {
  return (
    <div>
      <div className="flex p-[12px] justify-center items-center transitioned text-(--color-text) text-2xl">
        <h1>{message}</h1>
      </div>
    </div>
  );
}
