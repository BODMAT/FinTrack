"use client";

import { useRouter } from "next/navigation";
import { usePopupStore } from "@/store/popup";

export function AiLimitPopup() {
  const router = useRouter();
  const { close } = usePopupStore();

  const handleGoDonation = () => {
    close();
    router.push("/donation");
  };

  return (
    <section className="flex w-full flex-col items-center gap-5 py-2 text-center text-(--color-text)">
      <div className="flex h-14 w-14 items-center justify-center rounded-full border border-(--text-red) bg-(--bg-red) text-3xl font-bold text-(--text-red)">
        !
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-2xl font-semibold text-(--color-text)">
          AI limit reached
        </h3>
        <p className="max-w-[520px] text-sm leading-relaxed text-(--color-fixed-text)">
          You used all free analytics attempts. Donate to unlock unlimited AI
          analytics access instantly.
        </p>
      </div>

      <div className="flex gap-3 max-sm:w-full max-sm:flex-col">
        <button type="button" onClick={handleGoDonation} className="custom-btn">
          Open Donation Stripe
        </button>
        <button type="button" onClick={close} className="custom-btn">
          Close
        </button>
      </div>
    </section>
  );
}
