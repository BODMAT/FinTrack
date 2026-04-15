"use client";

type DonationResultType = "success" | "error";

interface DonationResultPopupProps {
  type: DonationResultType;
  title: string;
  message: string;
}

export function DonationResultPopup({
  type,
  title,
  message,
}: DonationResultPopupProps) {
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
