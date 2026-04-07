import DeleteIcon from "@/assets/transactions/delete-icon.svg?react";
import ChangeIcon from "@/assets/transactions/edit-box-icon.svg?react";
import { usePopupStore } from "@/store/popup";
import type { ResponseTransaction } from "@fintrack/types";
import { ChangeTransactionPopup } from "./ChangeTransactionPopup";
import { DeleteTransactionPopup } from "./DeleteTransactionPopup";
import { useCurrency } from "@/hooks/useCurrency";
import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

export function TransactionsCard({ data }: { data: ResponseTransaction }) {
  const { open } = usePopupStore();
  const { t } = useSafeTranslation();
  const { displayCurrency, convertAmount, formatMoney } = useCurrency();

  const handleOpenChange = (id: string) => () =>
    open("Change transaction", <ChangeTransactionPopup id={id} key={id} />);
  const handleOpenDelete = (id: string) => () =>
    open("Delete transaction", <DeleteTransactionPopup id={id} />);
  return (
    <div className="grid grid-cols-8 items-center gap-[16px] p-[12px] rounded border border-(--color-fixed-text) text-(--color-text) transitioned roboto text-[18px] max-[1300px]:grid-cols-7 max-[1000px]:grid-cols-6 max-[970px]:grid-cols-3 max-[450px]:grid-cols-2">
      <span className="justify-self-center px-[8px] truncate break-all whitespace-normal text-center">
        {data.title}
      </span>
      <span className="justify-self-center px-[8px] font-semibold">
        {formatMoney(
          convertAmount(
            Number(data.amount),
            data.currencyCode ?? "USD",
            displayCurrency,
          ),
          displayCurrency,
        )}
      </span>
      <span
        className={`justify-self-center py-[8px] px-[20px] text-sm rounded-xl text-gray-40 ${data.type === "INCOME" ? "bg-(--bg-green)" : "bg-(--bg-red)"}`}
      >
        {data.type === "INCOME"
          ? t("dashboard.card.income")
          : t("dashboard.card.outcome")}
      </span>
      <span className="col-span-2 max-[1000px]:col-span-1 justify-self-center px-[8px] wrap-break-word whitespace-normal text-center">
        {`${new Date(data.created_at || 0).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} ${new Date(data.created_at || 0).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}`}
      </span>
      <span className="text-center col-span-2 max-[1300px]:col-span-1 justify-self-center px-[8px] wrap-break-word whitespace-normal">
        {data.location
          ? `${data.location.latitude.toFixed(3)}, ${data.location.longitude.toFixed(3)}`
          : t("transactions.noLocation")}
      </span>
      <span className="flex gap-[12px] max-[1200px]:flex-col max-[1200px]:justify-self-center max-[1200px]:gap-[4px] max-[970px]:flex-row">
        <button
          onClick={handleOpenChange(data.id)}
          className="rotate-45 w-[56px] h-[56px] justify-self-center cursor-pointer p-[4px] hover:text-(--color-hover) rounded transitioned hover:scale-110"
        >
          <ChangeIcon />
        </button>
        <button
          onClick={handleOpenDelete(data.id)}
          className="w-[56px] h-[56px] justify-self-center cursor-pointer p-[4px] hover:text-(--color-hover) rounded transitioned hover:scale-110"
        >
          <DeleteIcon />
        </button>
      </span>
    </div>
  );
}
