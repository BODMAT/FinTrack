import type { FormTransaction } from "@/types/transaction";

interface TransactionTypeSectionProps {
  form: FormTransaction;
  onTypeChange: (type: "INCOME" | "EXPENSE") => void;
}

export function TransactionTypeSection({
  form,
  onTypeChange,
}: TransactionTypeSectionProps) {
  return (
    <div className="flex gap-[28px] items-center justify-center max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
      <label className="text-(--color-text) text-[20px] font-semibold">
        <input
          className="mr-[12px]"
          type="radio"
          name="transactionType"
          checked={form.type === "INCOME"}
          onChange={() => onTypeChange("INCOME")}
        />
        Income
      </label>
      <label className="text-(--color-text) text-[20px] font-semibold">
        <input
          className="mr-[12px]"
          type="radio"
          name="transactionType"
          checked={form.type === "EXPENSE"}
          onChange={() => onTypeChange("EXPENSE")}
        />
        Outcome
      </label>
    </div>
  );
}
