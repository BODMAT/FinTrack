import DeleteIcon from "../../assets/transactions/delete-icon.svg?react";
import ChangeIcon from "../../assets/transactions/edit-box-icon.svg?react";
import { usePopupStore } from "../../store/popup";
import type { ResponseTransaction } from "@fintrack/types";
import { ChangeTransactionPopup } from "./ChangeTransactionPopup";
import { DeleteTransactionPopup } from "./DeleteTransactionPopup";

export function TransactionsCard({ data }: { data: ResponseTransaction }) {
  const { open } = usePopupStore();

  const handleOpenChange = (id: string) => () =>
    open("Change transaction", <ChangeTransactionPopup id={id} key={id} />);
  const handleOpenDelete = (id: string) => () =>
    open("Delete transaction", <DeleteTransactionPopup id={id} />);
  return (
    <div className="grid grid-cols-8 items-center gap-4 p-3 rounded border border-[var(--color-fixed-text)] text-[var(--color-text)] transitioned roboto text-[18px] max-[1300px]:grid-cols-7 max-[1000px]:grid-cols-6 max-[970px]:grid-cols-3 max-[450px]:grid-cols-2">
      <span className="justify-self-center px-2 truncate break-all whitespace-normal text-center">
        {data.title}
      </span>
      <span className="justify-self-center px-2 font-semibold">
        ${Number(data.amount).toFixed(2)}
      </span>
      <span
        className={`justify-self-center py-2 px-5 text-sm rounded-xl text-gray-40 ${data.type === "INCOME" ? "bg-[var(--bg-green)]" : "bg-[var(--bg-red)]"}`}
      >
        {data.type === "INCOME" ? "Income" : "Outcome"}
      </span>
      <span className="col-span-2 max-[1000px]:col-span-1 justify-self-center px-2 break-words whitespace-normal text-center">
        {`${new Date(data.created_at || 0).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })} ${new Date(data.created_at || 0).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })}`}
      </span>
      <span className="text-center col-span-2 max-[1300px]:col-span-1 justify-self-center px-2 break-words whitespace-normal">
        {data.location
          ? `${data.location.latitude.toFixed(3)}, ${data.location.longitude.toFixed(3)}`
          : "No location"}
      </span>
      <span className="flex gap-3 max-[1200px]:flex-col max-[1200px]:justify-self-center max-[1200px]:gap-1 max-[970px]:flex-row">
        <button
          onClick={handleOpenChange(data.id)}
          className="rotate-[45deg] w-14 h-14 justify-self-center cursor-pointer p-1 hover:text-[var(--color-hover)] rounded transitioned hover:scale-110"
        >
          <ChangeIcon />
        </button>
        <button
          onClick={handleOpenDelete(data.id)}
          className="w-14 h-14 justify-self-center cursor-pointer p-1 hover:text-[var(--color-hover)] rounded transitioned hover:scale-110"
        >
          <DeleteIcon />
        </button>
      </span>
    </div>
  );
}
