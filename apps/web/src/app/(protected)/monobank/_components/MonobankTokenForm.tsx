import { useSafeTranslation } from "@/shared/i18n/useSafeTranslation";

interface MonobankTokenFormProps {
  token: string;
  tokenError: string;
  isFetchingMonobankAccounts: boolean;
  isCooldownActive: boolean;
  remainingSeconds: number;
  onTokenChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}

export function MonobankTokenForm({
  token,
  tokenError,
  isFetchingMonobankAccounts,
  isCooldownActive,
  remainingSeconds,
  onTokenChange,
  onSubmit,
}: MonobankTokenFormProps) {
  const { t } = useSafeTranslation();

  return (
    <form
      onSubmit={onSubmit}
      className="neo-panel p-[18px] flex flex-col gap-[12px]"
    >
      <label className="text-(--color-text) text-[15px] font-semibold">
        {t("monobank.tokenLabel")}
      </label>
      <input
        value={token}
        onChange={(e) => onTokenChange(e.target.value)}
        type="password"
        placeholder="u3AulkpZFI1lIuGs..."
        className="rounded-[10px] border border-(--stroke-soft) bg-(--color-input) p-[12px] text-(--color-text) outline-none focus:border-(--color-hover)"
      />
      {tokenError && (
        <p className="text-(--text-red) text-[13px] font-medium">
          {tokenError}
        </p>
      )}
      <div className="flex items-center gap-[10px] max-[520px]:flex-col max-[520px]:items-start">
        <button
          type="submit"
          disabled={isFetchingMonobankAccounts || isCooldownActive}
          className="bg-(--color-card) rounded-[10px] px-[16px] py-[10px] text-(--color-text) border border-(--color-fixed-text) transitioned not-disabled:cursor-pointer not-disabled:hover:border-(--color-hover) not-disabled:hover:text-(--color-hover)"
        >
          {isFetchingMonobankAccounts
            ? t("monobank.checkingToken")
            : isCooldownActive
              ? `${remainingSeconds}s`
              : t("monobank.submitRequest")}
        </button>
        <span className="text-(--color-fixed-text) text-[13px]">
          {isCooldownActive
            ? t("monobank.cooldownLimit")
            : t("monobank.nextStep")}
        </span>
      </div>
    </form>
  );
}
