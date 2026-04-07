"use client";

type ResultType = "success" | "error";

interface MonobankResultPopupProps {
  type: ResultType;
  title: string;
  message: string;
}

export function MonobankResultPopup({
  type,
  title,
  message,
}: MonobankResultPopupProps) {
  return (
    <div className="space-y-[12px]">
      <h3
        className={`text-[18px] font-semibold ${
          type === "success" ? "text-(--text-green)" : "text-(--text-red)"
        }`}
      >
        {title}
      </h3>
      <p className="rounded-[12px] bg-(--color-input) p-[12px] text-(--color-text) text-[14px]">
        {message}
      </p>
    </div>
  );
}
