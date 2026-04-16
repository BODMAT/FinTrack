"use client";

import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { DonationLeaderboardItem } from "@/types/donation";
import { formatDonationAmount } from "@/utils/donation";

interface DonationLeaderboardProps {
  items: DonationLeaderboardItem[];
  isLoading: boolean;
}

export function DonationLeaderboard({
  items,
  isLoading,
}: DonationLeaderboardProps) {
  const { t } = useSafeTranslation();
  const marqueeItems = items.length > 1 ? [...items, ...items] : items;

  return (
    <section className="neo-panel p-[18px] overflow-hidden max-w-full">
      <h2 className="text-(--color-text) text-[20px] font-semibold mb-[12px]">
        {t("donation.leaderboardTitle")}
      </h2>
      <p className="text-(--color-fixed-text) text-[14px] mb-[14px]">
        {t("donation.leaderboardSubtitle")}
      </p>

      {items.length > 0 && !isLoading && (
        <div
          style={{ position: "relative", height: "90px", overflow: "hidden" }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              display: "flex",
              gap: "12px",
              animation:
                items.length > 1 ? "marqueeScroll 28s linear infinite" : "none",
            }}
          >
            {marqueeItems.map((item, index) => (
              <article
                key={`${item.userId}-${index}`}
                style={{ width: "260px", flexShrink: 0 }}
                className="rounded-[12px] border border-(--stroke-soft) bg-(--color-input) p-[12px]"
              >
                <div className="flex items-center justify-between gap-[10px]">
                  <div className="flex items-center gap-[10px]">
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        alt={item.name}
                        className="h-[38px] w-[38px] rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-[38px] w-[38px] rounded-full border border-(--stroke-soft) flex items-center justify-center text-[12px] font-semibold text-(--color-fixed-text)">
                        {item.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-(--color-text) font-semibold text-[14px]">
                        {item.name}
                      </p>
                      <p className="text-(--color-fixed-text) text-[12px]">
                        {t("donation.totalDonated")}
                      </p>
                    </div>
                  </div>

                  <p className="text-(--color-hover) font-bold text-[15px] whitespace-nowrap">
                    {formatDonationAmount(item.totalAmountMinor, item.currency)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
