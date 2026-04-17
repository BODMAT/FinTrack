import { useTransaction } from "@/hooks/useTransactions";
import { ChangeTransactionPopupForm } from "./ChangeTransactionPopupForm";

export function ChangeTransactionPopup({ id }: { id?: string }) {
  const { data: transaction, isLoading } = useTransaction({
    id,
    enabled: !!id,
  });

  if (id && isLoading) return <div>Loading...</div>;

  return <ChangeTransactionPopupForm id={id} initialData={transaction} />;
}
