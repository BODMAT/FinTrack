import { CustomMessage } from "@/shared/ui/Helpers";
import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import type { StatsTransaction } from "@/types/monobank-ui";

export function MonobankReadonlyTransactions({
  items,
}: {
  items: StatsTransaction[];
}) {
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();
  if (items.length === 0) {
    return <CustomMessage message={t("monobank.noTransactionsYet")} />;
  }

  return (
    <div className="max-h-[480px] overflow-y-auto pr-[6px] [scrollbar-width:thin] [scrollbar-color:var(--color-hover)_var(--color-input)] [&::-webkit-scrollbar]:w-[8px] [&::-webkit-scrollbar-track]:rounded-[999px] [&::-webkit-scrollbar-track]:bg-(--color-input) [&::-webkit-scrollbar-thumb]:rounded-[999px] [&::-webkit-scrollbar-thumb]:bg-(--color-hover)">
      <div className="flex flex-col gap-[12px]">
        {items.map((item) => (
          <article
            key={item.id}
            className="grid min-h-[68px] grid-cols-4 items-center gap-[10px] rounded-[12px] border border-(--stroke-soft) p-[12px] text-(--color-text) max-[700px]:grid-cols-2"
          >
            <div className="truncate text-[15px]">{item.title}</div>
            <div className="font-semibold text-center">
              {formatMoney(
                convertAmount(item.amount, item.currencyCode, displayCurrency),
                displayCurrency,
              )}
            </div>
            <div className="text-center">
              <span
                className={`rounded-[10px] px-[10px] py-[4px] text-[12px] ${
                  item.type === "INCOME"
                    ? "bg-(--bg-green) text-(--text-green)"
                    : "bg-(--bg-red) text-(--text-red)"
                }`}
              >
                {item.type}
              </span>
            </div>
            <div className="text-center text-[13px] text-(--color-fixed-text)">
              {item.createdAt.toLocaleDateString("en-GB", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })}{" "}
              {item.createdAt.toLocaleTimeString("en-GB", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
