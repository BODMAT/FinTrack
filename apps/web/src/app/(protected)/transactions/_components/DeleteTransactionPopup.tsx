import { useTransactionMutations } from "@/hooks/useTransactions";
import { usePopupStore } from "@/store/popup";
import { CustomMessage } from "@/shared/ui/Helpers";

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
      <div className="flex flex-col p-[12px] justify-center items-center transitioned text-(--color-text) text-2xl">
        <h1>Are you sure you want to delete this transaction?</h1>
        <div className="flex gap-[12px] justify-center items-center mt-[30px]">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="px-[12px] py-[8px] cursor-pointer bg-(--bg-red) rounded transitioned hover:bg-transparent border-2 border-(--bg-red)"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </button>
          <button
            onClick={close}
            className="px-[12px] py-[8px] cursor-pointer bg-(--bg-green) rounded transitioned hover:bg-transparent border-2 border-(--bg-green) "
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}





