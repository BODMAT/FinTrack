import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";
import { MonobankIntroPanel } from "./MonobankIntroPanel";
import { MonobankTokenForm } from "./MonobankTokenForm";
import { MonobankStoragePanel } from "./MonobankStoragePanel";
import { MonobankReadonlyTransactions } from "./MonobankReadonlyTransactions";
import { MonobankStats } from "./MonobankStats";
import type { StatsTransaction } from "@/types/monobank-ui";

interface MonobankContentProps {
  token: string;
  tokenError: string;
  isFetchingMonobankAccounts: boolean;
  isCooldownActive: boolean;
  remainingSeconds: number;
  isDeletingMonobankData: boolean;
  transactions: StatsTransaction[];
  onTokenChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onDelete: () => void;
}

export function MonobankContent({
  token,
  tokenError,
  isFetchingMonobankAccounts,
  isCooldownActive,
  remainingSeconds,
  isDeletingMonobankData,
  transactions,
  onTokenChange,
  onSubmit,
  onDelete,
}: MonobankContentProps) {
  const { t } = useSafeTranslation();

  return (
    <section className="w-full space-y-[20px]">
      <MonobankIntroPanel />

      <MonobankTokenForm
        token={token}
        tokenError={tokenError}
        isFetchingMonobankAccounts={isFetchingMonobankAccounts}
        isCooldownActive={isCooldownActive}
        remainingSeconds={remainingSeconds}
        onTokenChange={onTokenChange}
        onSubmit={onSubmit}
      />

      <MonobankStoragePanel
        isDeletingMonobankData={isDeletingMonobankData}
        onDelete={onDelete}
      />

      <div className="grid grid-cols-2 gap-[18px] max-[1180px]:grid-cols-1">
        <section className="neo-panel p-[16px]">
          <h2 className="mb-[12px] text-(--color-text) text-[24px] font-semibold">
            {t("monobank.transactionsTitle")}
          </h2>
          <p className="mb-[12px] text-(--color-fixed-text) text-[13px]">
            {t("monobank.readonlyDesc")}
          </p>
          <MonobankReadonlyTransactions items={transactions} />
        </section>

        <section>
          <MonobankStats items={transactions} />
        </section>
      </div>
    </section>
  );
}
