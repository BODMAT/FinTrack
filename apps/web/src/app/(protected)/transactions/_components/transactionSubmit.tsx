import type { CreateTransaction, UpdateTransaction } from "@fintrack/types";
import type { ReactNode } from "react";
import { CustomMessage } from "@/shared/ui/Helpers";
import type { FormTransaction } from "@/types/transaction";

interface SubmitTransactionParams {
  id?: string;
  form: FormTransaction;
  manualCurrencyCode: "USD" | "UAH" | "EUR";
  createTxErrorMessage?: string;
  updateTxErrorMessage?: string;
  updateTx: (payload: {
    id: string;
    payload: UpdateTransaction;
  }) => Promise<unknown>;
  createTx: (payload: CreateTransaction) => Promise<unknown>;
  open: (title: string, content: ReactNode) => void;
  close: () => void;
}

export async function submitTransaction({
  id,
  form,
  manualCurrencyCode,
  createTxErrorMessage,
  updateTxErrorMessage,
  updateTx,
  createTx,
  open,
  close,
}: SubmitTransactionParams) {
  try {
    const data: CreateTransaction = {
      title: form.title,
      type: form.type,
      created_at: form.created_at,
      updated_at: new Date(),
      amount: +form.amount,
      currencyCode: form.currencyCode ?? manualCurrencyCode,
    };
    if (form.latitude && form.longitude) {
      data.location = {
        latitude: +form.latitude,
        longitude: +form.longitude,
      };
    }
    if (id) {
      await updateTx({
        id,
        payload: data satisfies UpdateTransaction,
      });
      close();
      setTimeout(
        () =>
          open(
            "Notification",
            <CustomMessage message="Transaction changed successfully!" />,
          ),
        300,
      );
      return;
    }

    await createTx(data satisfies CreateTransaction);
    close();
    setTimeout(
      () =>
        open(
          "Notification",
          <CustomMessage message="Transaction added successfully!" />,
        ),
      300,
    );
  } catch (error) {
    open(
      "Error",
      <CustomMessage
        message={`Something went wrong! ${createTxErrorMessage || updateTxErrorMessage || error || ""}`}
      />,
    );
  }
}
