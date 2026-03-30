import { useTransactionMutations } from "../../hooks/useTransactions";
import { usePopupStore } from "../../store/popup";
import { CustomMessage } from "../Helpers";

export function DeleteTransactionPopup({ id }: { id: string }) {
  const { open, close } = usePopupStore();
  const { deleteTx, deleteTxErrorMessage, isDeleting } =
    useTransactionMutations();
  const handleDelete = async () => {
    try {
      await deleteTx(id);
      close();
      setTimeout(
        () =>
          open(
            "Notification",
            <CustomMessage message="Transaction deleted successfully!" />,
          ),
        300,
      );
    } catch (err) {
      console.error(err);
      close();
      setTimeout(
        () =>
          open(
            "Notification",
            <CustomMessage
              message={`Something went wrong: ${deleteTxErrorMessage}`}
            />,
          ),
        300,
      );
    }
  };
  return (
    <div>
      <div className="flex flex-col p-3 justify-center items-center transitioned text-[var(--color-text)] text-2xl">
        <h1>Are you sure you want to delete this transaction?</h1>
        <div className="flex gap-3 justify-center items-center mt-[30px]">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-3 py-2 cursor-pointer bg-[var(--bg-red)] rounded transitioned hover:bg-transparent border-2 border-[var(--bg-red)]"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={close}
            className="px-3 py-2 cursor-pointer bg-[var(--bg-green)] rounded transitioned hover:bg-transparent border-2 border-[var(--bg-green)] "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
