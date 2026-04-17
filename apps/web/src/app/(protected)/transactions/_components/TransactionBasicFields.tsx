import { toLocalDatetimeString } from "@/utils/components";
import type { FormTransaction } from "@/types/transaction";

interface TransactionBasicFieldsProps {
  form: FormTransaction;
  displayCurrency: string;
  onTitleChange: (value: string) => void;
  onDateChange: (value: string) => void;
  onAmountChange: (value: string) => void;
}

export function TransactionBasicFields({
  form,
  displayCurrency,
  onTitleChange,
  onDateChange,
  onAmountChange,
}: TransactionBasicFieldsProps) {
  return (
    <>
      <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
        <label
          className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
          htmlFor="location"
        >
          Title:
        </label>
        <input
          required
          type="text"
          id="title"
          placeholder="Title..."
          value={form.title}
          onChange={(e) => onTitleChange(e.target.value)}
          className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
        />
      </div>
      <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
        <label
          className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
          htmlFor="date"
        >
          Date:
        </label>
        <input
          required
          type="datetime-local"
          max={toLocalDatetimeString(new Date())}
          value={toLocalDatetimeString(form.created_at || new Date())}
          onChange={(e) => onDateChange(e.target.value)}
          id="date"
          className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
        />
      </div>
      <div className="flex items-center gap-[20px] max-[500px]:flex-col max-[500px]:items-stretch max-[500px]:gap-[12px]">
        <label
          className="text-(--color-text) text-[20px] font-semibold min-w-[120px]"
          htmlFor="amount"
        >
          Amount ({displayCurrency}):
        </label>
        <input
          required
          type="text"
          inputMode="decimal"
          id="amount"
          min={1}
          placeholder="Amount..."
          value={form.amount}
          onChange={(e) => onAmountChange(e.target.value)}
          className="bg-(--color-input) rounded-[10px] p-[10px] w-full border border-(--color-fixed-text) text-(--color-text) transitioned hover:border-(--color-hover)"
        />
      </div>
    </>
  );
}
